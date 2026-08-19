/* ============================================================================
   EXISTENCE AND UNIQUENESS FOR y′ = F(x, y)
   Syllabus gap B4 (MASTER-PLAN §3.2). Two stages on the question every other
   ODE stage in the wing takes for granted.

     odExist   builds the solution twice — Picard's iteration and Euler's
               polygons — inside the rectangle the theorem is stated on, and
               measures the Lipschitz constant that decides whether either is
               entitled to converge.
     odUnique  removes the hypothesis and shows what is lost: two different
               solutions through one point, and a perturbation whose
               amplification grows without bound.

   The engine is `26a-ode-exist.js` and is unit-tested. Nothing here decides
   whether a field is Lipschitz by looking it up — odLipScan measures it, on
   the reader's own field as readily as on a preset.
   ============================================================================ */

/* one short segment per grid point, at the slope the equation assigns there.
   Batched into a single path: 200 segments must not be 200 paint calls. */
function odFieldDraw(ctx, P, F, nx, ny, col, len){
  const NX = nx || 17, NY = ny || 13;
  ctx.strokeStyle = col; ctx.lineWidth = 1.1;
  ctx.beginPath();
  const dx = (P.x1 - P.x0) / NX, dy = (P.y1 - P.y0) / NY;
  const L = len || Math.min(P.pw / NX, P.ph / NY) * 0.42;
  for(let i = 0; i <= NX; i++){
    const x = P.x0 + dx * i;
    for(let j = 0; j <= NY; j++){
      const y = P.y0 + dy * j;
      const m = F(x, y);
      if(!Number.isFinite(m)) continue;
      /* the slope is a SCREEN slope: the same number means different angles on
         different axis scales, and drawing it as a data slope would tilt every
         tick of the field the moment the y-window changed */
      const sm = m * (P.ph / (P.y1 - P.y0)) / (P.pw / (P.x1 - P.x0));
      const c = 1 / Math.hypot(1, sm), s = sm * c;
      const X = P.X(x), Y = P.Y(y);
      ctx.moveTo(X - L * c, Y + L * s); ctx.lineTo(X + L * c, Y - L * s);
    }
  }
  ctx.stroke();
}
/* A sampled solution, drawn INSIDE the box and nowhere else — the same rule
   `plotCurve` follows, and for the same reason. Clamping the samples to the
   window instead invents data: e^x leaving the top of a window fitted to the
   box came back as a flat line ruled along y = y₀ + b, which reads as a
   solution that levels off. Every caller here draws inside `pvClip`, so the
   clipping is done for us; the wide band below only keeps the coordinates
   finite, because a y of 1e300 makes the rasteriser drop the whole path and a
   blow-up would erase the curve it belongs to. */
function odDrawSamples(ctx, P, xs, ys, col, w, dash){
  ctx.strokeStyle = col; ctx.lineWidth = w;
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath();
  const band = (P.y1 - P.y0) * 4, lo = P.y0 - band, hi = P.y1 + band;
  let on = false, prev = NaN;
  for(let i = 0; i < xs.length; i++){
    const y = ys[i];
    if(!Number.isFinite(y)){ on = false; continue; }
    const yc = Math.max(lo, Math.min(hi, y));
    /* two samples pinned to OPPOSITE bands are the two sides of a pole, never a
       chord — joining them would rule a line from +∞ to −∞ across the picture */
    if(on && ((prev === hi && yc === lo) || (prev === lo && yc === hi))) on = false;
    const X = P.X(xs[i]), Y = P.Y(yc);
    on ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    on = true; prev = yc;
  }
  ctx.stroke();
  if(dash) ctx.setLineDash([]);
}
/* the Lipschitz ladder as readout rows — the same evidence in both stages, so
   it is written once (SITE-RULES §2.2) */
function odLipRows(S){
  return S.rows.map(r => kv('δ = ' + fmtSig(r.d, 3),
    Number.isFinite(r.L) ? fmtSig(r.L, 5) : 'the field is not defined on that pair')).join('') +
    kv('ratio of the last two', Number.isFinite(S.ratio) ? fmtNum(S.ratio, 4) : '—') +
    kv('verdict', S.lip
      ? '<b>Lipschitz</b> — the quotient settled, so a constant exists'
      : '<b style="color:var(--c-pos)">no Lipschitz constant</b> — the quotient keeps growing as δ shrinks');
}

STAGES.odExist = {
  title:'Existence and uniqueness',
  dockLegend:true,
  /* ---------------------------------------------------------------- state --- */
  enter(st, o){
    st.scene = o.scene || 'picard';
    st.key = o.key || 'linear';
    st.src = o.src || 'x + y';
    st.N = o.N === undefined ? 8 : o.N;
    st.nE = o.nE === undefined ? 8 : o.nE;
    const E = this.curOf(st);
    st.y0 = o.y0 === undefined ? E.y0 : o.y0;
    st.err = '';
    this.recompute(st);
  },
  /* the accessor: a typed field is shaped exactly like a table entry, so
     everything downstream reads cur(st) and knows nothing about which is which */
  curOf(st){
    if(st.key === 'custom'){
      let F = (x, y) => x + y;
      try { const C = pkCompile(st.src); F = (x, y) => C(x, y, 0); } catch(e){ /* kept below */ }
      return { k:'custom', name:'y′ = ' + pkPretty(st.src), F, exact:null,
        x0:0, y0:1, a:1, b:2,
        note:'Your own field. Every number in the panel is measured for it the same way it is for the presets — the Lipschitz constant by scanning difference quotients, M by sampling the rectangle, and Picard\'s limit against an RK4 run that shares nothing with it.' };
    }
    return OD_FIELDS[st.key] || OD_FIELDS.linear;
  },
  recompute(st){
    const E = this.curOf(st);
    st.err = '';
    if(st.key === 'custom'){
      try { pkCompile(st.src); } catch(e){ st.err = String(e && e.message || e); }
    }
    const F = E.F, x0 = E.x0, y0 = st.y0, a = E.a, b = E.b;
    const key = [st.key, st.key === 'custom' ? st.src : '', st.scene, st.N, st.nE, y0].join('|');
    if(st.cacheKey === key && st.box) return;
    st.cacheKey = key;
    /* the rectangle, and how far the theorem reaches on it */
    const M = odFieldM(F, x0, y0, a, b);
    const h = odPicardH(M, a, b);
    const S = odLipScan(F, x0, y0, a, b);
    st.box = { M, h, a, b, x0, y0, binds: (Number.isFinite(M) && M > 0 && b / M < a) ? 'b/M' : 'a' };
    st.lip = S;
    /* PICARD. The iterates live on the grid; the reference is RK4 on the same
       nodes, so the two can be differenced node by node. */
    const P = odPicardRun(F, x0, y0, h, Math.max(1, Math.round(st.N)), 160);
    const ref = odRefRun(F, x0, y0, P.xs, P.c, 8);
    st.pic = P; st.ref = ref;
    st.picGap = odSupGap(P.iters[P.iters.length - 1], ref);
    /* The scale a sup-norm gap is read against is the size of the EXCURSION,
       not of y itself: at y₀ = 80 the solution moves by 17 and quoting a
       residual against 80 flatters it fivefold. M·h is what the field could
       have produced over the interval, and it is the floor for the case where
       the solution does not move at all (F ≡ 0 along it). */
    st.picScale = Math.max(odSupAbs(ref.map(v => v - y0)), M * h, 1e-300);
    st.stay = odSupAbs(P.iters[P.iters.length - 1].map(v => v - y0));
    /* EULER. The window stops short of any escape: a polygon marched past the
       point where the solution ceased to exist is not a worse approximation,
       it is an approximation to nothing. */
    const esc = odEscape(F, x0, y0, 1, 1e6, a);
    st.esc = esc;
    st.stops = esc.escaped;
    const reach = st.stops ? Math.min(a, 0.85 * (esc.x - x0)) : a;
    const x1 = x0 + Math.max(1e-6, reach);
    st.x1 = x1;
    const fine = odStepTo(F, x0, y0, x1, 20000);
    const cf = E.exact ? E.exact(x1, x0, y0) : NaN;
    st.refEnd = Number.isFinite(cf) ? cf : fine;
    st.refFrom = Number.isFinite(cf) ? 'the closed form' : 'RK4 at 20 000 steps';
    const n = Math.max(2, Math.round(st.nE));
    st.poly = [n, 2 * n, 4 * n].map(k => odEuler(F, x0, y0, (x1 - x0) / k, k));
    /* The order is measured from a FIXED base count, doubled twice. It is a
       property of the method, not of the slider — and letting the slider drive
       it would push RK4's error under float64 round-off at the top of the
       range, where the measured "order" becomes noise. */
    st.ordN = 8;
    st.ord = {
      euler:odOrderRef(odEuler, F, x0, y0, x1, st.ordN, st.refEnd),
      heun: odOrderRef(odHeun, F, x0, y0, x1, st.ordN, st.refEnd),
      rk4:  odOrderRef(odRK4First, F, x0, y0, x1, st.ordN, st.refEnd)
    };
    /* the reference CURVE the euler scene draws, built once here rather than
       re-integrated on every frame */
    const K = 600, rx = new Float64Array(K + 1), ry = new Float64Array(K + 1);
    let cur = y0; rx[0] = x0; ry[0] = y0;
    for(let i = 1; i <= K; i++){
      const xa = x0 + (x1 - x0) * (i - 1) / K, xb = x0 + (x1 - x0) * i / K;
      cur = odStepTo(F, xa, cur, xb, 4);
      rx[i] = xb; ry[i] = cur;
    }
    st.eref = { xs:rx, ys:ry };
  },
  /* ------------------------------------------------------------- controls --- */
  controls(){
    const st = ST, E = this.curOf(st);
    return ctSeg('oeScene', st.scene,
        [['picard', "Picard's iteration"], ['euler', "Euler's polygons"]]) +
      pkSeg('oePick', OD_FIELDS, st.key, e => e.name) +
      (st.key === 'custom' ? fnHtml('oeSrc', 'F(x, y) =', st.src, 'the right-hand side of y′ = F(x, y)') : '') +
      ctlRow('the initial value y₀', ctlSlider('oeY0', E.y0 - 1.4 * E.b, E.y0 + 1.4 * E.b, E.b / 100, st.y0)) +
      (st.scene === 'picard'
        ? ctlRow('iterations n', ctlSlider('oeN', 1, 14, 1, st.N))
        : ctlRow('steps', ctlSlider('oeE', 2, 64, 1, st.nE))) +
      (st.scene === 'picard'
        ? `<p class="help">The theorem is stated on a <b>rectangle</b> R around the starting point, and
          the panel measures the two numbers that decide it: <b>M</b>, the largest |F| anywhere on R,
          and the <b>Lipschitz constant L</b>, found by scanning |ΔF|/Δy at five separations rather than
          guessed. The guaranteed interval is <b>h = min(a, b/M)</b>, drawn as the shaded strip — the
          solution cannot leave the box before it, because it cannot climb faster than M.</p>
          <p class="help">Picard's iteration starts from the constant function y₀ and integrates the
          field along whatever it currently believes the solution to be. Each iterate is drawn. The
          panel prints the measured gap between successive iterates <i>beside</i> the classical bound
          M·L<sup>n</sup>h<sup>n+1</sup>/(n+1)! — the bound must hold, and how much room it has to
          spare is the interesting part.</p>`
        : `<p class="help">Euler's polygon steps along the tangent line and repeats. Refine it and the
          polygons crowd onto one curve — and <i>that</i> is Peano's existence proof, which needs only
          that F be continuous. No Lipschitz condition is used anywhere in it, which is why it proves
          existence and cannot prove uniqueness.</p>
          <p class="help">The observed order of each method is <b>measured</b> by halving the step
          twice, never asserted: Euler should give 1, Heun 2 and RK4 4, and where it does not the panel
          says the number it actually found. ${esc(E.name)}</p>`) +
      `<p class="help">${E.note}</p>`;
  },
  wire(){
    const S = STAGES.odExist;
    ctWireSeg('oePick', v => {
      ST.key = v;
      ST.y0 = S.curOf(ST).y0;
      S.recompute(ST); buildStagePanel();
    });
    ctWireSeg('oeScene', v => { ST.scene = v; S.recompute(ST); buildStagePanel(); });
    fnWire('oeSrc', (made, src) => { ST.src = src; ST.cacheKey = ''; S.recompute(ST); },
           s => { const C = pkCompile(s); if(!Number.isFinite(C(0.3, 0.4, 0))) throw new Error('that field is not a number near the start'); return C; });
    wireSlider('oeY0', () => ST.y0, v => { ST.y0 = v; S.recompute(ST); }, v => fmtNum(+v, 4));
    wireSlider('oeN', () => ST.N, v => { ST.N = Math.round(v); S.recompute(ST); }, v => Math.round(v) + ' iterates');
    wireSlider('oeE', () => ST.nE, v => { ST.nE = Math.round(v); S.recompute(ST); }, v => Math.round(v) + ' steps');
  },
  /* ---------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const E = this.curOf(st), B = st.box;
    if(st.scene === 'euler'){ this.frameEuler(st, E, ctx, W, H); return; }
    const pad = 1.06;
    const P = mkPlot(70, 44, W - 108, H - 96,
      B.x0 - B.a * pad, B.x0 + B.a * pad, B.y0 - B.b * pad, B.y0 + B.b * pad);
    plotFrame(ctx, P, 'x', 'y', E.name + ' — the rectangle the theorem is stated on');
    plotTicksX(ctx, P, [B.x0 - B.a, B.x0 - B.a / 2, B.x0, B.x0 + B.a / 2, B.x0 + B.a], v => fmtTick(v, B.a / 2));
    plotTicksY(ctx, P, [B.y0 - B.b, B.y0, B.y0 + B.b], v => fmtTick(v, B.b));
    pvClip(ctx, P, () => {
      odFieldDraw(ctx, P, E.F, 19, 13, rgbCss(TH.faint, 0.7));
      /* the guaranteed strip |x − x0| ≤ h */
      ctx.fillStyle = rgbCss(TH.grad, 0.1);
      ctx.fillRect(P.X(B.x0 - B.h), P.Y(B.y0 + B.b), P.X(B.x0 + B.h) - P.X(B.x0 - B.h),
                   P.Y(B.y0 - B.b) - P.Y(B.y0 + B.b));
      /* the rectangle R itself */
      ctx.strokeStyle = rgbCss(TH.dim); ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      ctx.strokeRect(P.X(B.x0 - B.a), P.Y(B.y0 + B.b),
                     P.X(B.x0 + B.a) - P.X(B.x0 - B.a), P.Y(B.y0 - B.b) - P.Y(B.y0 + B.b));
      ctx.setLineDash([]);
      /* the cone of slopes ±M: no solution can leave it, and where it meets the
         top of the box is where the promise stops */
      if(Number.isFinite(B.M) && B.M > 0){
        ctx.strokeStyle = rgbCss(TH.curl, 0.6); ctx.lineWidth = 1.4;
        ctx.beginPath();
        for(const s of [1, -1]) for(const d of [1, -1]){
          ctx.moveTo(P.X(B.x0), P.Y(B.y0));
          ctx.lineTo(P.X(B.x0 + d * B.a), P.Y(B.y0 + s * B.M * B.a));
        }
        ctx.stroke();
      }
      /* the iterates, oldest palest */
      const it = st.pic.iters;
      for(let n = 1; n < it.length - 1; n++)
        odDrawSamples(ctx, P, st.pic.xs, it[n], rgbCss(TH.grad, 0.18 + 0.5 * n / it.length), 1.3);
      odDrawSamples(ctx, P, st.pic.xs, st.ref, rgbCss(TH.warn, 0.45), 5);
      odDrawSamples(ctx, P, st.pic.xs, it[it.length - 1], rgbCss(TH.grad), 2.4);
    });
    ctx.fillStyle = rgbCss(TH.text);
    ctx.beginPath(); ctx.arc(P.X(B.x0), P.Y(B.y0), 4.5, 0, 6.2832); ctx.fill();
    stageNote(ctx, 'shaded strip: the interval h = min(a, b/M) the theorem guarantees · pale wedge: the slopes |y′| ≤ M no solution can beat', W, H);
  },
  frameEuler(st, E, ctx, W, H){
    const B = st.box, x0 = B.x0, x1 = st.x1;
    /* fitted over EXACTLY the list that is drawn below — a window fitted to
       some of the curves is the failure mode ./auditframe.ps1 exists for */
    let lo = st.y0, hi = st.y0;
    const scan = arr => { for(const v of arr) if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); } };
    scan(st.eref.ys);
    for(const p of st.poly) scan(p.ys);
    if(!(hi > lo)){ lo -= 1; hi += 1; }
    /* QUANTISE THE WINDOW, then tick on multiples of the step. A window fitted
       exactly to the data has arbitrary endpoints, and fmtTick derives its
       precision from the step it is given — so a step of 1.218281828 is
       faithfully printed to nine decimals, which is how this axis first read
       `2.218281828`. The step is the thing that has to be a round number;
       fmtTick then needs one decimal and cannot produce a duplicate. */
    const m = (hi - lo) * 0.1;
    const qy = ctNiceStep((hi + m) - (lo - m));
    const ylo = Math.floor((lo - m) / qy) * qy, yhi = Math.ceil((hi + m) / qy) * qy;
    const P = mkPlot(70, 44, W - 108, H - 96, x0, x1, ylo, yhi);
    plotFrame(ctx, P, 'x', 'y', E.name + ' — the polygon, refined');
    const qx = ctNiceStep(x1 - x0), tx = [];
    for(let v = Math.ceil(x0 / qx) * qx; v <= x1 + qx * 1e-6; v += qx) tx.push(v);
    plotTicksX(ctx, P, tx, v => fmtTick(v, qx));
    const ty = [];
    for(let v = ylo; v <= yhi + qy * 1e-6; v += qy) ty.push(v);
    plotTicksY(ctx, P, ty, v => fmtTick(v, qy));
    pvClip(ctx, P, () => {
      odFieldDraw(ctx, P, E.F, 21, 13, rgbCss(TH.faint, 0.7));
      /* the reference, thick and pale, so the polygons are read against it */
      odDrawSamples(ctx, P, st.eref.xs, st.eref.ys, rgbCss(TH.warn, 0.45), 5);
      const cols = [rgbCss(TH.faint, 0.85), rgbCss(TH.grad, 0.5), rgbCss(TH.grad)];
      st.poly.forEach((p, i) => odDrawSamples(ctx, P, p.xs, p.ys, cols[i], 1.4 + i * 0.6));
      /* the vertices of the coarsest polygon — the corners ARE the method */
      const p0 = st.poly[0];
      ctx.fillStyle = rgbCss(TH.faint);
      for(let i = 0; i < p0.xs.length; i++){
        if(!Number.isFinite(p0.ys[i])) continue;
        ctx.beginPath(); ctx.arc(P.X(p0.xs[i]), P.Y(Math.max(P.y0, Math.min(P.y1, p0.ys[i]))), 2.4, 0, 6.2832); ctx.fill();
      }
    });
    stageNote(ctx, st.stops
      ? 'the window stops short of x = ' + fmtNum(st.esc.x, 4) + ', where this solution ceases to exist'
      : 'each refinement halves the step; the polygons crowd onto one curve, and that convergence is the existence proof', W, H);
  },
  /* -------------------------------------------------------------- readout --- */
  readout(st){
    const E = this.curOf(st);
    if(st.err)
      return `<div class="card tight"><div class="ttl">That field did not compile</div>
        <p class="help" style="color:var(--c-pos)">${esc(st.err)}</p>
        <p class="help">The previous field is kept until a readable one is typed.</p></div>`;
    this.recompute(st);
    return (st.scene === 'euler' ? this.readoutEuler(st, E) : this.readoutPicard(st, E)) +
      `<div class="card tight"><div class="ttl">${esc(E.name)}</div><p class="help">${E.note}</p></div>`;
  },
  readoutPicard(st, E){
    const B = st.box, S = st.lip, P = st.pic;
    const rows = P.steps.map(s => {
      const bound = odPicardBound(B.M, S.L, B.h, s.n);
      const r = bound > 0 ? s.gap / bound : NaN;
      return kv('sup|y' + (s.n + 1) + ' − y' + s.n + '|',
        fmtSig(s.gap, 4) + ' &nbsp; <span style="color:var(--dim)">bound ' + fmtSig(bound, 3) +
        (Number.isFinite(r) ? ' — using ' + fmtNum(100 * r, 3) + '% of it' : '') + '</span>');
    }).join('');
    return `<div class="card tight"><div class="ttl">The rectangle, and how far it reaches</div>
      ${kv('start (x₀, y₀)', '(' + fmtNum(B.x0, 4) + ', ' + fmtNum(B.y0, 4) + ')')}
      ${kv('a — half-width in x', fmtNum(B.a, 4))}
      ${kv('b — half-height in y', fmtNum(B.b, 4))}
      ${kv('M = max|F| on R, measured', Number.isFinite(B.M) ? fmtSig(B.M, 5) : 'the field is not finite on R')}
      ${kv('h = min(a, b/M)', '<b>' + fmtSig(B.h, 5) + '</b> — ' + (B.binds === 'a' ? 'the width of R binds' : 'the HEIGHT binds: the solution would leave the box first'))}
      ${kv('largest |yₙ − y₀| reached', fmtSig(st.stay, 4) + (st.stay <= B.b * 1.0000001 ? ' — inside b, as the induction requires' : ' — OUTSIDE b'))}
      <p class="help">Nothing here is quoted. M is the largest |F| found by sampling the rectangle, and
      h is what that M allows: a solution whose slope never exceeds M cannot climb b in less than b/M,
      so it cannot escape the box before then. That single inequality is the entire reason the theorem
      is <b>local</b>, and it is why an equation as tame as y′ = 1 + y² is only promised 0.3 of an
      x-axis.</p>
    </div>
    <div class="card tight"><div class="ttl">Is F Lipschitz in y on R?</div>
      ${odLipRows(S)}
      <p class="help">L is sup|F(x, y₂) − F(x, y₁)|/|y₂ − y₁| over the rectangle, scanned at five
      separations. <b>One separation cannot tell the two cases apart</b>: a field with a vertical
      tangent in y returns a perfectly respectable finite number for any fixed δ, and only refusing to
      settle as δ shrinks gives it away. That is the hypothesis Picard–Lindelöf turns on — existence
      needs continuity alone, uniqueness needs this.</p>
    </div>
    <div class="card tight"><div class="ttl">Picard's iteration, measured</div>
      ${rows}
      ${kv('sup|y' + P.steps.length + ' − the solution|', fmtGap(st.picGap, st.picScale))}
      <p class="help">The bound beside each row is M·L<sup>n</sup>h<sup>n+1</sup>/(n+1)!, the classical
      estimate. It is an <i>inequality</i>, not an agreement, so the two numbers are printed side by
      side and the useful figure is how much of the bound the truth actually uses. The last row
      compares the final iterate with an RK4 integration on the same nodes — a method that shares
      nothing with a fixed-point iteration on an integral equation.</p>
      ${S.lip ? '' : '<p class="help" style="color:var(--c-pos)">L did not settle here, so the contraction argument does not apply and the bound above is not a bound. The iterates may still converge — they simply have nothing entitling them to.</p>'}
    </div>`;
  },
  readoutEuler(st, E){
    const O = st.ord;
    const row = (nm, r, want) => kv(nm,
      Number.isFinite(r.p1) && Number.isFinite(r.p2)
        ? fmtNum(r.p1, 3) + ', then ' + fmtNum(r.p2, 3) + ' <span style="color:var(--dim)">(expected ' + want + ')</span>'
        : (r.e1 === 0 && r.e2 === 0 ? 'exact at every step here — no order to measure' : 'not measurable at this setting'));
    return `<div class="card tight"><div class="ttl">The polygons converge</div>
      ${kv('interval', '[' + fmtNum(st.box.x0, 4) + ', ' + fmtNum(st.x1, 4) + ']' +
        (st.stops ? ' — cut short at x = ' + fmtNum(st.esc.x, 4) : ''))}
      ${kv('reference', st.refFrom)}
      ${kv('Euler error at ' + st.ordN + ' steps', fmtSig(O.euler.e1, 4))}
      ${kv('at twice as many', fmtSig(O.euler.e2, 4))}
      ${kv('at four times', fmtSig(O.euler.e4, 4))}
      <p class="help">Halving the step and watching the error fall is what "the polygons converge" means
      numerically. Peano's theorem is the same statement made rigorous: the polygons are equicontinuous
      because |y′| ≤ M, so by Arzelà–Ascoli some subsequence converges uniformly, and its limit solves
      the equation. Note the word <b>subsequence</b> — with continuity alone that is all you get, and it
      is exactly the loophole through which a second solution can arrive.</p>
    </div>
    <div class="card tight"><div class="ttl">The observed order, by halving h</div>
      ${row("Euler", O.euler, 1)}
      ${row("Heun", O.heun, 2)}
      ${row("RK4", O.rk4, 4)}
      <p class="help">Two halvings rather than one, because a single ratio cannot tell a genuine order
      from a coincidence. The base count is fixed at ${st.ordN} and doubled twice — the steps slider
      sets what is <i>drawn</i>, and letting it drive this as well would push RK4's error under float64
      round-off at the top of its range, where a measured "order" is noise. Where the number comes out
      below expectation the field is telling you something: a solution with a corner, or one running
      towards a place where it stops existing, has no Taylor expansion for the method to exploit.</p>
    </div>`;
  },
  chip(st){
    const B = st.box || {};
    if(st.scene === 'euler')
      return `<div class="k">Euler polygons</div>
        <div>${Math.round(st.nE)} steps</div>
        <div style="color:var(--c-grad)">order ${st.ord && Number.isFinite(st.ord.euler.p1) ? fmtNum(st.ord.euler.p1, 2) : '—'}</div>`;
    return `<div class="k">Picard · ${Math.round(st.N)} iterates</div>
      <div>h = ${Number.isFinite(B.h) ? fmtNum(B.h, 4) : '—'}</div>
      <div style="color:${st.lip && st.lip.lip ? 'var(--c-grad)' : 'var(--c-pos)'}">${st.lip && st.lip.lip ? 'L = ' + fmtNum(st.lip.L, 3) : 'no Lipschitz L'}</div>`;
  },
  legend(st){
    const s = st || ST;
    return (s && s.scene === 'euler')
      ? [['var(--c-warn)', 'the solution, integrated finely'],
         ['var(--faint)', 'the coarsest polygon, with its vertices'],
         ['var(--c-grad)', 'the same polygon at two and four times the steps']]
      : [['var(--c-grad)', "Picard's iterates — the last one darkest"],
         ['var(--c-warn)', 'the solution, by RK4 on the same nodes'],
         ['var(--dim)', 'the rectangle R, and the strip of width h inside it'],
         ['var(--c-curl)', 'the cone of slopes |y′| ≤ M no solution can beat']];
  },
  /* ---------------------------------------------------------------- derive -- */
  derive(st){
    if(st.scene === 'euler') return this.deriveEuler(st);
    const B = st.box || {}, S = st.lip || { rows:[] }, P = st.pic || { steps:[] };
    const n = v => fmtSig(v, 5);
    return {
      title:'Turning a differential equation into a fixed point',
      steps:[
        drvSay('the difficulty is that y appears on both sides',
          'y′ = F(x, y) cannot be integrated directly, because the thing to be integrated depends on the answer. Every method in this wing is a way round that, and Picard\'s is the one that turns it into a question about a map having a fixed point — which is a question with a general answer.'),
        drvStep('integrate the equation, and the initial condition comes with it',
          `${dv('y')}(${dv('x')}) ${dop('=')} ${dv('y')}₀ ${dop('+')} ∫ ${dv('F')}(${dv('t')}, ${dv('y')}(${dv('t')})) ${dv('dt')}`,
          'from x₀ to x — the two problems are equivalent, and this one needs only continuity'),
        drvSay('and that equivalence is where continuity is spent',
          'A solution of the differential equation is differentiable, so it can be integrated; a solution of the integral equation has a continuous integrand, so by the Fundamental Theorem it is differentiable and satisfies the original. Nothing is lost in either direction — but the integral form makes sense for functions that are merely continuous, which is what lets a fixed-point argument reach it.'),
        drvStep('iterate the right-hand side, starting from the constant y₀',
          `${dv('y')}_(n+1)(${dv('x')}) ${dop('=')} ${dv('y')}₀ ${dop('+')} ∫ ${dv('F')}(${dv('t')}, ${dv('y')}ₙ(${dv('t')})) ${dv('dt')}`,
          `each iterate is drawn; the last one is ${Math.round(st.N)} steps from the constant`),
        drvStep('bound the field on a rectangle, and the interval follows',
          `${dv('h')} ${dop('=')} min(${dv('a')}, ${dv('b')}/${dv('M')})`,
          `M = ${n(B.M)} measured on R, so h = ${n(B.h)} — ${B.binds === 'a' ? 'the width binds' : 'the height binds'}`),
        drvSay('this is the step people forget, and it is the reason the theorem is local',
          'A slope bounded by M cannot climb the b of the box in less than b/M. So on |x − x₀| ≤ h every iterate stays inside R, where F was bounded and Lipschitz — and outside it nothing was ever assumed. An equation can be a polynomial and still have its solution stop existing, because being a polynomial says nothing about M on a big rectangle.'),
        drvStep('a Lipschitz F makes the map a contraction',
          `‖${dv('T')}${dv('u')} ${dop('−')} ${dv('T')}${dv('v')}‖ ${dop('≤')} ${dv('L')}${dv('h')}‖${dv('u')} ${dop('−')} ${dv('v')}‖`,
          S.lip ? `L = ${n(S.L)} measured, Lh = ${n(S.L * B.h)}` : 'L did not settle here — the field has no Lipschitz constant on R'),
        drvSay('and the successive differences fall like a factorial, not like a geometric series',
          'The crude contraction estimate needs Lh < 1. The sharper induction keeps the power of (x − x₀) inside the integral and gives sup|y_(n+1) − y_n| ≤ M·Lⁿhⁿ⁺¹/(n+1)!, which converges for ANY h — so the theorem never needs the interval shortened to make Lh small. The panel prints that bound beside the gap actually measured.'),
        drvStep('so the iterates converge, and the limit is the unique solution',
          `${dv('y')}ₙ ${dop('→')} ${dv('y')}, &nbsp; ${dv('y')} ${dop('=')} ${dv('T')}${dv('y')}`,
          P.steps.length ? `measured against RK4: ${fmtGap(st.picGap, st.picScale)}` : ''),
        drvSay('uniqueness is the same inequality read once more',
          'If two solutions had the same initial value, their difference would satisfy ‖u − v‖ ≤ Lh‖u − v‖ on a short enough interval, forcing it to zero; then the argument restarts from the far end and covers the whole interval. Every step of that used L. Take the Lipschitz condition away and the chain breaks at exactly one link — which is why y′ = 3∛(y²) can have uncountably many solutions through one point while still being perfectly continuous.')
      ],
      note:'The bound and the measurement are different objects and are printed as such. An inequality that held would be no evidence at all if the two were ever conflated — what the panel shows is how much of the bound the truth actually uses, which is typically a few per cent.'
    };
  },
  deriveEuler(st){
    const O = st.ord || {};
    const n = v => Number.isFinite(v) ? fmtNum(v, 3) : '—';
    return {
      title:'Existence without a Lipschitz condition — Peano, by polygon',
      steps:[
        drvSay('why a second existence proof is worth having',
          'Picard needs F Lipschitz in y. That is a real restriction: √y, ∛(y²) and every field with a vertical tangent fail it, and those are not exotic — they are what a draining tank and a spreading crack look like. Peano\'s theorem needs only continuity, and buys existence alone.'),
        drvStep('step along the tangent line and repeat',
          `${dv('y')}_(k+1) ${dop('=')} ${dv('y')}_k ${dop('+')} ${dv('h')}${dv('F')}(${dv('x')}_k, ${dv('y')}_k)`,
          `${Math.round(st.nE)} steps across the interval, then twice and four times as many`),
        drvSay('the polygons cannot wander, and that is the whole trick',
          'Every segment has slope at most M, so all the polygons are Lipschitz with the SAME constant M — uniformly equicontinuous, and uniformly bounded because they cannot leave the box. Arzelà–Ascoli then says some subsequence converges uniformly.'),
        drvStep('and the limit satisfies the integral equation',
          `${dv('y')}(${dv('x')}) ${dop('=')} ${dv('y')}₀ ${dop('+')} ∫ ${dv('F')}(${dv('t')}, ${dv('y')}(${dv('t')})) ${dv('dt')}`,
          'uniform convergence lets the limit pass inside the integral, and F is uniformly continuous on the compact box'),
        drvSay('note what was NOT proved',
          'A subsequence converged. Different subsequences may converge to different limits, and when uniqueness fails they do — which is not a defect of the proof but an accurate report of the situation. Peano gives existence; only a Lipschitz condition upgrades "some subsequence" to "the whole sequence, to one limit".'),
        drvStep('the observed order, by halving h twice',
          `${dv('e')}(${dv('h')}) ${dop('∼')} ${dv('C')}${dv('h')}^p ${dop('⇒')} p ${dop('=')} log₂ ${dfrac(dv('e') + '(' + dv('h') + ')', dv('e') + '(' + dv('h') + '/2)')}`,
          `Euler ${n(O.euler && O.euler.p1)} then ${n(O.euler && O.euler.p2)}; Heun ${n(O.heun && O.heun.p1)}; RK4 ${n(O.rk4 && O.rk4.p1)}`),
        drvSay('and the order is a measurement, not a property of the name',
          'Euler is first order on a smooth problem. On a solution with a corner, or one approaching a place where it stops existing, the Taylor expansion the order rests on does not exist and the measured number drops. Reading the order off the method\'s name rather than off the numbers is how a convergence study comes to certify a wrong answer.')
      ],
      note:'The reference is ' + (st.refFrom || 'a fine integration') + '. Where a closed form exists it is used, because an order measured against another numerical method measures the difference between two errors rather than one.'
    };
  }
};

/* ============================================================================
   odUnique — what the Lipschitz condition was buying
   ============================================================================ */
STAGES.odUnique = {
  title:'Where uniqueness fails',
  dockLegend:true,
  enter(st, o){
    st.key = o.key || 'cuberoot';
    st.src = o.src || '3*(y*y)^(1/3)';
    st.c = o.c === undefined ? 0.5 : o.c;
    const E = this.curOf(st);
    st.y0 = o.y0 === undefined ? E.y0 : o.y0;
    st.err = '';
    this.recompute(st);
  },
  curOf(st){
    if(st.key === 'custom'){
      let F = (x, y) => 3 * Math.cbrt(y * y);
      try { const C = pkCompile(st.src); F = (x, y) => C(x, y, 0); } catch(e){ /* reported below */ }
      return { k:'custom', name:'y′ = ' + pkPretty(st.src), F, exact:null, family:null,
        x0:0, y0:1, a:1.5, b:1.5,
        note:'Your own field. The Lipschitz scan, the perturbation sweep and the escape hunt all run on it unchanged — so whether Picard–Lindelöf applies to what you typed is measured here, not assumed.' };
    }
    return OD_FIELDS[st.key] || OD_FIELDS.cuberoot;
  },
  recompute(st){
    const E = this.curOf(st);
    st.err = '';
    if(st.key === 'custom'){
      try { pkCompile(st.src); } catch(e){ st.err = String(e && e.message || e); }
    }
    const F = E.F, x0 = E.x0, y0 = st.y0, a = E.a, b = E.b;
    const key = [st.key, st.key === 'custom' ? st.src : '', st.c, y0].join('|');
    if(st.cacheKey === key && st.lip) return;
    st.cacheKey = key;
    st.lip = odLipScan(F, x0, y0, a, b);
    st.M = odFieldM(F, x0, y0, a, b);
    /* the same question asked ON the solution rather than over the box: is
       ∂F/∂y defined right where this particular solution runs? */
    st.local = odLipScan(F, x0, y0, a / 200, Math.max(1e-9, b / 150));
    /* how far the solution reaches, before anything is measured across an
       interval it does not survive */
    st.esc = odEscape(F, x0, y0, 1, 1e6, 40);
    st.auto = odAutonomy(F, x0, y0, a, b);
    st.escQ = (st.esc.escaped && st.auto.autonomous) ? odEscapeQuad(F, x0, y0, st.esc.y) : NaN;
    st.stops = st.esc.escaped;
    const x1 = x0 + (st.stops ? Math.min(a, 0.6 * (st.esc.x - x0)) : a);
    st.x1 = x1;
    st.sens = odSensitivity(F, x0, y0, x1, [1e-2, 1e-4, 1e-6, 1e-8], 8000);
    st.vari = st.local.lip ? odVariational(F, x0, y0, x1, 6000) : { ok:false };
    /* Grönwall needs a finite L. Where the scan refused to settle there is no
       constant to put in the exponent, and printing e^(20.9·1.5) from the
       largest quotient the scan happened to reach would be a bound derived
       from a number that does not exist. */
    st.gron = st.lip.lip ? odGronwall(st.lip.L, x0, x1) : NaN;
    /* the alternative solutions, where the table knows a family. Each is put
       back into the equation rather than taken on trust. */
    st.alts = [];
    if(E.family && Math.abs(y0 - E.y0) < 1e-12){
      for(const c of [0, st.c, a]){
        const g = E.family(c);
        const R = odResidual(g, F, x0 - a, x0 + a, 500);
        /* THE SCALE IS COMPUTED HERE, not at the point of printing, so the
           readout and the stage test read one number (§2.4). y ≡ 0 is a
           solution whose own gross ∮|F| is exactly zero, and a residual quoted
           against that prints a perfect result as a 5000% disagreement — the
           FALSE-SCALE failure. What the zero cancelled is the largest slope
           this field produces on the rectangle, which is M. */
        st.alts.push({ c, g, resid:R.resid, gross:R.gross, scale:Math.max(R.gross, st.M, 1e-300) });
      }
    }
    /* every curve the picture draws, integrated once here. Re-running four
       bundles of 500 RK4 steps inside frame() would be ~50 000 field
       evaluations sixty times a second (MASTER-PLAN §2.12). */
    const K = 500, xs = new Float64Array(K + 1);
    for(let i = 0; i <= K; i++) xs[i] = x0 - a + 2 * a * i / K;
    const march = start => {
      const ys = new Float64Array(K + 1);
      /* out from the marked point in both directions — the solution through a
         point is not the solution started at the left edge */
      let c0 = K / 2 | 0;
      while(c0 > 0 && xs[c0] > x0) c0--;
      ys[c0] = start;
      let cur = start;
      for(let j = c0 + 1; j <= K; j++){ cur = odStepTo(F, xs[j - 1], cur, xs[j], 6); ys[j] = cur; }
      cur = start;
      for(let j = c0 - 1; j >= 0; j--){ cur = odStepTo(F, xs[j + 1], cur, xs[j], 6); ys[j] = cur; }
      return ys;
    };
    st.curves = {
      xs,
      base:march(y0),
      bundle:[1e-2, 1e-4, 1e-6].map(e => march(y0 + e)),
      alts:st.alts.map(A => { const ys = new Float64Array(K + 1); for(let j = 0; j <= K; j++) ys[j] = A.g(xs[j]); return ys; })
    };
    /* THE WINDOW IS FITTED OVER EXACTLY THE LIST THAT IS DRAWN, and it is built
       here so it cannot drift from that list (`auditframe`'s rule, and the
       failure mode it exists for). The rectangle is NOT the right frame for this
       stage: the cube-root family reaches ±3.375 over |x| ≤ 1.5 while the box is
       only ±1.5 tall, and clipping the curves at its edge would hide the very
       divergence the picture is about. The rectangle belongs to odExist, where
       the theorem confines the solution to it by construction.
       The fit is bounded at three box-heights so one blowing-up solution cannot
       flatten every other curve onto the axis — beyond that it runs off the top,
       which is the honest picture of a solution that ceases to exist. */
    let lo = y0, hi = y0;
    const scan = arr => { for(const v of arr) if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); } };
    scan(st.curves.base);
    for(const ys of st.curves.bundle) scan(ys);
    for(const ys of st.curves.alts) scan(ys);
    lo = Math.max(lo, y0 - 3 * b); hi = Math.min(hi, y0 + 3 * b);
    if(!(hi > lo)){ lo = y0 - b; hi = y0 + b; }
    const pad = (hi - lo) * 0.06;
    const q = ctNiceStep((hi + pad) - (lo - pad));
    st.win = { lo:Math.floor((lo - pad) / q) * q, hi:Math.ceil((hi + pad) / q) * q, q };
  },
  controls(){
    const st = ST, E = this.curOf(st);
    const fam = E.family && Math.abs(st.y0 - E.y0) < 1e-12;
    return pkSeg('ouPick', OD_FIELDS, st.key, e => e.name) +
      (st.key === 'custom' ? fnHtml('ouSrc', 'F(x, y) =', st.src, 'the right-hand side of y′ = F(x, y)') : '') +
      ctlRow('the initial value y₀', ctlSlider('ouY0', E.y0 - 1.4 * E.b, E.y0 + 1.4 * E.b, E.b / 100, st.y0)) +
      (fam ? ctlRow('leave the axis at ±c', ctlSlider('ouC', 0, E.a, E.a / 60, st.c)) : '') +
      `<p class="help">Two solutions through one point is not a paradox and not a numerical artefact —
      it is what happens when <b>∂F/∂y is unbounded</b> at the starting value. The panel measures that
      directly: the Lipschitz quotient is scanned at five separations, and a quotient that keeps
      growing as the separation shrinks is a constant that does not exist.</p>
      <p class="help">${fam
        ? 'Slide <b>c</b> and watch a different solution appear through the same point. It leaves the axis at −c and at +c, sits at zero in between, and is a cube on either side. Every one of them is substituted back into the equation and its residual printed — they all solve it exactly.'
        : 'This field has no second solution to draw. If the scan below settles, Picard–Lindelöf says there is exactly one, and the panel would be lying to offer another.'}</p>
      <p class="help">${E.note}</p>`;
  },
  wire(){
    const S = STAGES.odUnique;
    ctWireSeg('ouPick', v => {
      ST.key = v; ST.y0 = S.curOf(ST).y0; S.recompute(ST); buildStagePanel();
    });
    fnWire('ouSrc', (made, src) => { ST.src = src; ST.cacheKey = ''; S.recompute(ST); },
           s => { const C = pkCompile(s); if(!Number.isFinite(C(0.3, 0.4, 0))) throw new Error('that field is not a number near the start'); return C; });
    wireSlider('ouY0', () => ST.y0, v => { ST.y0 = v; S.recompute(ST); }, v => fmtNum(+v, 4));
    wireSlider('ouC', () => ST.c, v => { ST.c = v; S.recompute(ST); }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const E = this.curOf(st), x0 = E.x0, a = E.a, b = E.b, y0 = st.y0;
    const P = mkPlot(70, 44, W - 108, H - 96, x0 - a, x0 + a, st.win.lo, st.win.hi);
    /* the caption names TWO populations, because the picture holds two: the
       solid curves go through the marked point, the dashed ones start a hair
       above it. An earlier version said "every curve here passes through the
       same point", which was false of half of them. */
    plotFrame(ctx, P, 'x', 'y', E.name + (st.alts.length
      ? ' — solid: through the marked point · dashed: from a hair above it'
      : ' — the solution, and three that start a hair above it'));
    plotTicksX(ctx, P, [x0 - a, x0, x0 + a], v => fmtTick(v, a));
    const ty = [];
    for(let v = st.win.lo; v <= st.win.hi + st.win.q * 1e-6; v += st.win.q) ty.push(v);
    plotTicksY(ctx, P, ty, v => fmtTick(v, st.win.q));
    const C = st.curves;
    pvClip(ctx, P, () => {
      odFieldDraw(ctx, P, E.F, 21, 13, rgbCss(TH.faint, 0.7));
      /* the alternative solutions, drawn from the family the table declares */
      C.alts.forEach((ys, i) =>
        odDrawSamples(ctx, P, C.xs, ys, rgbCss(TH.grad, i === 1 ? 1 : 0.4), i === 1 ? 2.6 : 1.6));
      /* the bundle of solutions from perturbed starts — thin, and fanning out
         exactly where continuous dependence fails */
      for(const ys of C.bundle) odDrawSamples(ctx, P, C.xs, ys, rgbCss(TH.curl, 0.75), 1.3, [5, 4]);
      /* and the one the numerics actually returns from the exact start */
      odDrawSamples(ctx, P, C.xs, C.base, rgbCss(TH.warn, 0.55), 5);
    });
    ctx.fillStyle = rgbCss(TH.text);
    ctx.beginPath(); ctx.arc(P.X(x0), P.Y(y0), 4.5, 0, 6.2832); ctx.fill();
    stageNote(ctx, st.alts.length
      ? 'the solid curves all solve the same equation with the same initial value — RK4 returned only the gold one and told you nothing about the rest'
      : 'the dashed curves start a hair above the marked point; how far they drift is what continuous dependence measures', W, H);
  },
  readout(st){
    const E = this.curOf(st);
    if(st.err)
      return `<div class="card tight"><div class="ttl">That field did not compile</div>
        <p class="help" style="color:var(--c-pos)">${esc(st.err)}</p></div>`;
    this.recompute(st);
    const S = st.lip, V = st.vari;
    /* The difference quotient is compared with the derivative at ε = 10⁻⁴, and
       that ε is chosen BEFORE looking at the answers. It has to be: the
       quotient carries an O(ε) truncation and an O(machine/ε) cancellation, so
       it is worst at both ends of the ladder and picking whichever row happened
       to agree best would be choosing the result. The ladder is printed whole,
       with each row's own deviation, so the shape of that trade-off is visible
       rather than summarised away. */
    const cmpRow = st.sens.rows.filter(r => r.eps === 1e-4)[0] || st.sens.rows[0];
    const sens = st.sens.rows.map(r => kv('ε = ' + fmtSig(r.eps, 2),
      r.ok ? 'separation ' + fmtSig(r.sep, 4) + ' &nbsp; <span style="color:var(--dim)">ratio ' +
             fmtSig(r.ratio, 6) + (V.ok && Number.isFinite(r.ratio) && Math.abs(V.v) > 0
               ? ', off by ' + fmtSig(100 * Math.abs(r.ratio - V.v) / Math.abs(V.v), 2) + '%' : '') + '</span>'
           : 'the perturbed solution left the region')).join('');
    /* the scale each residual is read against was decided in recompute — see
       the note there on why the candidate's own gross will not do */
    const alts = st.alts.length
      ? st.alts.map(A => kv('c = ' + fmtNum(A.c, 3) + (A.c === 0 ? ' — the cubic' : (A.c >= E.a ? ' — the flat one, y ≡ 0' : '')),
          'residual ' + fmtGap(A.resid, A.scale))).join('')
      : kv('second solutions found', S.lip
          ? 'none — and by Picard–Lindelöf there are none'
          : 'this field has no closed-form family in the table; the scan above still says one may exist');
    return `<div class="card tight"><div class="ttl">Is F Lipschitz in y here?</div>
      ${odLipRows(S)}
      <p class="help">Uniqueness is not a property of differential equations; it is a property of
      <i>this</i> right-hand side near <i>this</i> starting value. Move y₀ off the axis and the same
      field becomes perfectly well behaved — ∂F/∂y = 2/∛y is only unbounded at y = 0 — which is why the
      scan is run at the initial point rather than quoted for the equation.</p>
    </div>
    <div class="card tight"><div class="ttl">Other solutions through the same point</div>
      ${alts}
      <p class="help">${st.alts.length
        ? 'Each candidate is <b>substituted back</b>: the panel differentiates the drawn curve numerically and compares with F evaluated on it. The residual is read against the largest slope the field produces on this rectangle — not against the candidate\'s own slopes, because y ≡ 0 has none and a perfect result would then print as a total disagreement. They are solutions, not approximations: the corner where each leaves the axis is C¹, since a cubic meets its tangent there to second order.'
        : 'A family would be drawn here if one existed. When the scan settles, the contraction argument closes and there is provably nothing else to show.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Continuous dependence on the initial value</div>
      ${kv('measured to x₁', fmtNum(st.x1, 5) + (st.stops ? ' — short of where the solution stops' : ''))}
      ${sens}
      ${kv('∂y(x₁)/∂y₀, by the variational equation', V.ok ? fmtSig(V.v, 6) : 'not defined — ∂F/∂y is unbounded on this solution')}
      ${kv('the two routes, compared at ε = 10⁻⁴', V.ok && cmpRow && Number.isFinite(cmpRow.ratio)
        ? fmtAgree(cmpRow.ratio, V.v)
        : 'no limit for the ratio to be compared with')}
      ${kv("Grönwall's bound e^(L·Δx)", Number.isFinite(st.gron)
        ? fmtSig(st.gron, 5) + (V.ok && Math.abs(V.v) <= st.gron * (1 + 1e-9) ? ' — and the amplification is inside it' : '')
        : 'no finite L, so the bound is e^∞ and says nothing')}
      <p class="help">${V.ok
        ? 'The ratio must settle onto ∂y/∂y₀ as ε shrinks — and it does, because v′ = F_y·v is exactly the linearisation the ratio is a difference quotient of. Grönwall bounds that number by e^(LΔx) whatever the field does in between, so a Lipschitz constant buys not merely uniqueness but a limit on how fast two solutions can separate.'
        : 'The ratio does not settle: it grows without bound as ε shrinks, so there is no number ∂y/∂y₀ for it to approach. That is the same failure as non-uniqueness seen from the other side — with L infinite, Grönwall\'s bound says nothing, and two initial values a millionth apart end up a finite distance apart.'}</p>
    </div>
    <div class="card tight"><div class="ttl">How far does the solution reach?</div>
      ${kv('marching the equation in x', st.esc.escaped
        ? 'left every bound by x = ' + fmtNum(st.esc.x, 7)
        : 'no blow-up out to x = ' + fmtNum(st.esc.x, 5))}
      ${st.esc.escaped && st.auto.autonomous
        ? kv('the same, by ∫dy/F in y instead', Number.isFinite(st.escQ) ? fmtNum(st.escQ, 7) : '—') +
          kv('the two routes', Number.isFinite(st.escQ) ? fmtAgree(st.esc.x, st.escQ) : '—')
        : kv('the second route', st.auto.autonomous
            ? 'not needed — nothing ran away to infinity'
            : 'F depends on x, so the variables do not separate')}
      <p class="help">${st.esc.escaped
        ? 'The two routes share nothing: one takes steps in x and watches y, the other never leaves the y-axis — it integrates dx/dy = 1/F from the starting height to the escaping one. Their agreement is what makes the escape point a measurement rather than the place a particular integrator gave up.'
        : 'No blow-up was found along the path marched, and that is <b>weaker than saying the solution exists there</b>. A solution can also stop by running into a <b>vertical tangent</b>, where y stays perfectly finite and it is the slope that is not — and a marching integrator does not notice. Select y′ = −x/y and watch: the true solution is √(4 − x²) and it ends at x = 2, but the marcher steps straight through y = 0 onto the lower branch and carries on reporting numbers. Only the field itself can tell you that, which is why the rectangle is where the theorem is stated and why it promises nothing outside it.'}</p>
    </div>
    <div class="card tight"><div class="ttl">${esc(E.name)}</div><p class="help">${E.note}</p></div>`;
  },
  chip(st){
    const S = st.lip || {};
    const last = st.sens && st.sens.rows.length ? st.sens.rows[st.sens.rows.length - 1] : null;
    return `<div class="k">${st.alts && st.alts.length ? st.alts.length + ' solutions drawn' : 'one solution'}</div>
      <div style="color:${S.lip ? 'var(--c-grad)' : 'var(--c-pos)'}">${S.lip ? 'Lipschitz, L = ' + fmtNum(S.L, 3) : 'no Lipschitz L'}</div>
      <div>amplification ${last && Number.isFinite(last.ratio) ? fmtSig(last.ratio, 3) : '—'}</div>`;
  },
  legend(st){
    const s = st || ST;
    const has = s && s.alts && s.alts.length;
    return [['var(--c-warn)', 'what RK4 returns from the marked point'],
            ['var(--c-grad)', has ? 'other exact solutions through the same point' : 'no second solution exists here'],
            ['var(--c-curl)', 'starts a hair above the point (dashed)'],
            ['var(--faint)', 'the slope field']];
  },
  derive(st){
    const S = st.lip || { rows:[] }, V = st.vari || {};
    const rows = st.sens ? st.sens.rows : [];
    const first = rows[0], last = rows[rows.length - 1];
    return {
      title:'What the Lipschitz condition was buying all along',
      steps:[
        drvSay('existence and uniqueness are two theorems, not one',
          'Peano gives existence from continuity alone. Everything else — uniqueness, continuous dependence, and the right to say "the" solution — comes from the Lipschitz condition, and this stage takes it away to see which parts fall over.'),
        drvStep('the field is continuous everywhere, so a solution exists',
          `${dv('y')}′ ${dop('=')} 3∛(${dv('y')}²)`,
          'no discontinuity, no singularity in the value of F — Peano\'s hypothesis is met with room to spare'),
        drvStep('but its y-derivative is unbounded at y = 0',
          `∂${dv('F')}/∂${dv('y')} ${dop('=')} ${dfrac('2', '∛' + dv('y'))}`,
          S.rows.length ? `measured: L = ${fmtSig(S.rows[0].L, 4)} at δ = ${fmtSig(S.rows[0].d, 3)}, rising to ${fmtSig(S.L, 4)} at δ = ${fmtSig(S.rows[S.rows.length - 1].d, 3)}` : ''),
        drvSay('and one separation would have hidden that completely',
          'At δ = 0.003 the quotient is about 21 — a finite number, and nothing about it looks wrong. Only refusing to settle as δ shrinks distinguishes an unbounded derivative from a large one, which is why the panel scans a ladder rather than sampling once. A single-δ check would have certified this field as Lipschitz.'),
        drvStep('so the family of solutions is uncountable',
          `${dv('y')}(${dv('x')}) ${dop('=')} (${dv('x')} ${dop('−')} ${dv('c')})³ for ${dv('x')} ${dop('>')} ${dv('c')}, &nbsp; 0 otherwise`,
          'any c ≥ 0 works, and the two halves glue with matching value AND slope'),
        drvSay('the corner is C¹, which is what makes them genuine solutions',
          'At x = c both pieces have value 0 and slope 0, so the join is differentiable — a cubic leaves a tangent line to second order. If the pieces met with a kink the glued function would not be differentiable there and would solve nothing. The panel differentiates each drawn curve numerically and prints the residual, so this is checked rather than argued.'),
        drvStep('and continuous dependence goes with uniqueness',
          `${dfrac('|' + dv('y') + '_ε(' + dv('x') + '₁) ' + dop('−') + ' ' + dv('y') + '(' + dv('x') + '₁)|', 'ε')} ${dop('≤')} ${dv('e')}^(${dv('L')}(${dv('x')}₁${dop('−')}${dv('x')}₀))`,
          first && last ? `measured: ${fmtSig(first.ratio, 4)} at ε = ${fmtSig(first.eps, 2)}, ${fmtSig(last.ratio, 4)} at ε = ${fmtSig(last.eps, 2)}` : ''),
        drvSay('a ratio that grows as ε shrinks has no limit to be bounded',
          V.ok
            ? 'Here the ratio settles onto ∂y(x₁)/∂y₀, the solution of the variational equation v′ = F_y·v — the exact amplification of an infinitesimal nudge. Grönwall\'s inequality caps it at e^(LΔx), which is the quantitative form of "the solution depends continuously on where it started".'
            : 'Here it does not settle: ε shrinks by a hundred and the ratio grows by a hundred, because a perturbation ε lifts the solution onto the branch through ∛ε and arrives finitely far away. There is no ∂y/∂y₀ at all, Grönwall\'s bound is e^∞, and "the" solution was never a legitimate phrase for this initial value.'),
        drvSay('and the numerics will not warn you',
          'RK4 started from exactly y₀ = 0 returns y ≡ 0 for ever, because F(x, 0) = 0 makes every stage of every step zero. It is a correct solution. It is also one of infinitely many, and no step-size reduction, error estimate or adaptive tolerance can reveal the others — the question is not numerical.')
      ],
      note:'Uniqueness is a property of the field at the starting value, not of the equation. Move y₀ off the axis with the slider and the same right-hand side becomes Lipschitz on the rectangle, the family collapses to one curve, and the amplification ratio settles.'
    };
  }
};
