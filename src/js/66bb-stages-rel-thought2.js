/* ============================================================================
   GROUP 1b · THE THOUGHT EXPERIMENTS, WITH THE READER'S OWN NUMBERS
   The panel half of Programme A relativity items 14 (`rlClock`), 15 (`rlTrain`)
   and 17 (`rlChase`); the arithmetic is in 46i-sr-events.js. Each stage gains a
   mode: the existing one is the picture the textbook draws, and the new one is
   the general case it is an instance of.
   ============================================================================ */

/* ---- item 14 · a light clock of any shape --------------------------------- */

function rlClkCur(st){
  if(st.ckey !== 'custom'){
    const P = RL_CLOCKS[st.ckey] || RL_CLOCKS.across;
    return { name:P.name, short:P.short, Lx:P.Lx, Ly:P.Ly, legs:P.legs, why:P.why };
  }
  const own = pkOwn(st, 'rlclk', [], RL_CLK_BOUNDS);
  return { name:'your own clock', short:'yours', own:true,
           Lx:+own.Lx, Ly:+own.Ly, legs:null,
           why:'Put the mirror anywhere. The tick still comes out at exactly γ times the rest tick — ' +
                'the light path is solved for, not assumed — and the two halves of it are equal only ' +
                'when the arm is exactly across the motion. That last fact is what Michelson and Morley ' +
                'built an interferometer to detect, and it is why they found nothing.' };
}
const RL_CLK_BOUNDS = [{ k:'Lx', label:'mirror x =', def:0.8 },
                       { k:'Ly', label:'mirror y =', def:0.6 }];

function rlClkControls(st){
  const C = rlClkCur(st);
  return ctlRow('the mirror', ctSeg('rlClK', st.ckey,
      Object.keys(RL_CLOCKS).map(k => [k, RL_CLOCKS[k].short]).concat([['custom', 'type your own']]))) +
    pkBoxes('rlclk', st.ckey, st, [], RL_CLK_BOUNDS,
      'Where the mirror sits, in the clock\'s own frame, in units of anything you like — ' +
      'the tick scales with the arm and the <b>ratio does not</b>.') +
    ctlRow('clock speed β', ctlSlider('rlClB', 0, 0.97, 0.005, st.beta)) +
    `<p class="help">The textbook light clock points its mirror straight across the motion, because that
    is the case Pythagoras does in one line. Point it anywhere and the same clock still runs slow by
    exactly <b>γ</b> — but the two halves of the tick are no longer equal, and for an arm along the
    motion they are in the ratio <b>(1+β)/(1−β)</b>. ${C.why || ''}</p>`;
}
function rlClkWire(){
  pkWire('rlClK', 'rlclk', ST.ckey, ST, [], RL_CLK_BOUNDS, v => { ST.ckey = v; });
  wireSlider('rlClB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
}

function rlClkFrame(st, ctx, W, H){
  const C = rlClkCur(st);
  const T = rlClockTick(C.Lx, C.Ly, st.beta);
  if(!T.ok){ rlText(ctx, W / 2, H / 2, T.why, rgbCss(TH.neg), '12px ' + FONT_UI, 'center'); return; }
  const gap = 26, top = 56, bot = 78;
  const pw = (W - 3 * gap) / 2, ph = Math.max(80, H - top - bot);
  /* ONE SCALE FOR BOTH PANES, so the lab path is visibly longer than the rest
     path rather than being renormalised into looking the same — that visible
     difference is the whole content. The half-width is taken from the wider of
     the two journeys and the scale from the pane's smaller dimension, so a
     collinear path (mirror dead ahead) and a tall one (mirror across) both fit. */
  const span = Math.max(2.2 * T.L, 1.3 * (Math.abs(T.emitterAt.x) + T.L));
  const sc = Math.min(pw, ph) / span;
  const pane = px => ({ px, py:top, pw, ph,
    X: x => px + pw / 2 - (T.emitterAt.x / 2) * sc + x * sc,
    Y: y => top + ph * 0.55 - y * sc });
  const A = pane(gap), B = pane(2 * gap + pw);

  const draw = (P, pts, title, col) => {
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(P.px, P.py, P.pw, P.ph);
    ctx.save(); ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    /* the clock's own arm, and the light path over it */
    rlSegment(ctx, P.X(pts.e0.x), P.Y(pts.e0.y), P.X(pts.m.x), P.Y(pts.m.y), rgbCss(TH.warn, 0.95), 2.4);
    rlSegment(ctx, P.X(pts.m.x), P.Y(pts.m.y), P.X(pts.e1.x), P.Y(pts.e1.y), rgbCss(TH.pos, 0.95), 2.4);
    rlDot(ctx, P.X(pts.e0.x), P.Y(pts.e0.y), 5, rgbCss(TH.grad), rgbCss(TH.bg));
    rlDot(ctx, P.X(pts.m.x), P.Y(pts.m.y), 5, rgbCss(TH.curl), rgbCss(TH.bg));
    rlDot(ctx, P.X(pts.e1.x), P.Y(pts.e1.y), 5, rgbCss(TH.grad), rgbCss(TH.bg));
    ctx.restore();
    ctx.font = '600 12.5px ' + FONT_UI;
    rlText(ctx, ctTitleClearChip(ctx, P.px + P.pw / 2, top - 34, title), top - 34, title,
           rgbCss(col), '600 12.5px ' + FONT_UI, 'center');
  };
  draw(A, { e0:v3(0, 0, 0), m:v3(C.Lx, C.Ly, 0), e1:v3(0, 0, 0) },
       'the clock\'s own frame', TH.grad);
  draw(B, { e0:v3(0, 0, 0), m:T.mirrorAt, e1:T.emitterAt },
       'the lab, at β = ' + fmtNum(st.beta, 3), TH.pos);
  rlText(ctx, A.px + A.pw / 2, top - 16, 'out ' + fmtNum(T.L, 5) + '  ·  back ' + fmtNum(T.L, 5) +
         '  ·  tick ' + fmtNum(T.rest, 6), rgbCss(TH.dim), '11px ' + FONT_MONO, 'center');
  rlText(ctx, B.px + B.pw / 2, top - 16, 'out ' + fmtNum(T.tOut, 5) + '  ·  back ' + fmtNum(T.tBack, 5) +
         '  ·  tick ' + fmtNum(T.lab, 6), rgbCss(TH.dim), '11px ' + FONT_MONO, 'center');

  /* the ledger, under the panes */
  let by = top + ph + 16;
  const bw = Math.min(W - 2 * gap - 8, 680);
  const line = (lbl, val, col) => {
    rlText(ctx, gap + 4, by, lbl, rgbCss(TH.dim), '11px ' + FONT_UI);
    rlText(ctx, gap + 4 + bw, by, val, rgbCss(col), '11px ' + FONT_MONO, 'right');
    by += 18;
  };
  line('the two legs, in the lab', fmtNum(T.tOut, 6) + '  and  ' + fmtNum(T.tBack, 6) +
       '   (ratio ' + fmtNum(T.legRatio, 5) + ')', TH.warn);
  line('the tick, against γ × the rest tick',
       fmtNum(T.lab, 8) + '  vs  ' + fmtNum(T.expect, 8) + '   ' + fmtAgreeTight(T.lab, T.expect), TH.pos);
  stageNote(ctx, 'orange is the outward leg, green the return  ·  ' +
    'they are equal only for a mirror exactly across the motion, and the total never notices', W, H);
}

function rlClkReadout(st){
  const C = rlClkCur(st);
  const T = rlClockTick(C.Lx, C.Ly, st.beta);
  if(!T.ok) return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    <p class="help" style="color:var(--c-neg)">${T.why}</p></div>`;
  const equal = Math.abs(T.legRatio - 1) < 1e-9;
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('mirror, in the clock\'s frame', '(' + fmtNum(C.Lx, 5) + ', ' + fmtNum(C.Ly, 5) + ')')}
    ${kv('arm length', fmtNum(T.L, 6))}
    ${kv('and in the lab, contracted along x', '(' + fmtNum(T.lx, 5) + ', ' + fmtNum(T.ly, 5) + ')')}
    ${kv('β, γ', fmtNum(st.beta, 4) + ',  ' + fmtNum(T.gamma, 6))}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">One tick, from the light's path</div>
    ${kv('at rest: out and back', fmtNum(T.rest, 8))}
    ${kv('in the lab: the outward leg', fmtNum(T.tOut, 8))}
    ${kv('in the lab: the return leg', fmtNum(T.tBack, 8))}
    ${kv('their ratio', equal ? '1 — exactly equal' : fmtNum(T.legRatio, 8))}
    ${kv('the whole tick', fmtNum(T.lab, 9))}
    ${kv('γ × the rest tick', fmtNum(T.expect, 9))}
    ${kv('difference', fmtAgree(T.lab, T.expect))}
    ${kv('and each leg is a null path to', fmtGap(Math.max(T.nullOut, T.nullBack), T.rest))}
    <p class="help">${equal
      ? 'The two halves are equal here, which happens only for a mirror exactly across the motion. That ' +
        'is why every textbook draws this one: the geometry is a single right triangle and the answer ' +
        'falls out in a line. Point the mirror anywhere else and the halves come apart.'
      : 'The two halves are <b>not</b> equal — the light chases a mirror that is running away and then ' +
        'meets an emitter that has moved on. For an arm along the motion the ratio is exactly ' +
        '(1+β)/(1−β), which at β = ' + fmtNum(st.beta, 3) + ' is ' +
        fmtNum((1 + st.beta) / (1 - st.beta), 5) + '. The <b>total</b> does not notice, and that is the ' +
        'result: no orientation of the instrument gives a different answer.'}</p>
    <p class="help">The arm is <b>contracted</b> along the motion — that is why the lab mirror sits at
    x = ${fmtNum(T.lx, 5)} rather than ${fmtNum(C.Lx, 5)}. Leave the contraction out and the two arms of
    the instrument disagree by 25% at β = 0.6: that discrepancy is precisely the fringe shift Michelson
    and Morley went looking for, and its absence is what length contraction was invented to explain.</p>
  </div>`;
}
function rlClkChip(st){
  const C = rlClkCur(st);
  const T = rlClockTick(C.Lx, C.Ly, st.beta);
  if(!T.ok) return `<div class="k">Light clock</div><div style="color:var(--c-neg)">no tick</div>`;
  return `<div class="k">Light clock</div>
    <div style="color:var(--c-warn)">legs ${fmtNum(T.tOut, 4)} / ${fmtNum(T.tBack, 4)}</div>
    <div style="color:var(--c-pos)">tick ${fmtNum(T.lab, 6)}</div>
    <div style="color:var(--c-grad)">γ×rest ${fmtNum(T.expect, 6)}</div>`;
}

/* ---- item 15 · an event pair the reader places ---------------------------- */

const RL_EV_BOUNDS = [{ k:'t1', label:'t₁ =', def:0 }, { k:'x1', label:'x₁ =', def:0 },
                      { k:'t2', label:'t₂ =', def:0.4 }, { k:'x2', label:'x₂ =', def:2 }];
function rlEvCur(st){
  if(st.ekey !== 'custom'){
    const P = RL_EVENTS[st.ekey] || RL_EVENTS.lightning;
    return { name:P.name, short:P.short, t1:P.t1, x1:P.x1, t2:P.t2, x2:P.x2,
             kind:P.kind, flips:P.flips, why:P.why };
  }
  const own = pkOwn(st, 'rlev', [], RL_EV_BOUNDS);
  return { name:'two events you placed', short:'yours', own:true,
           t1:+own.t1, x1:+own.x1, t2:+own.t2, x2:+own.x2, kind:null, flips:null,
           why:'Place them anywhere. The order reverses under some boost <b>exactly when</b> the pair ' +
                'is spacelike — those are not two conditions, they are the same one: β = Δt/Δx lies ' +
                'inside (−1, 1) precisely when |Δx| > |Δt|.' };
}
function rlEvControls(st){
  const C = rlEvCur(st);
  return ctlRow('the two events', ctSeg('rlTrE', st.ekey,
      Object.keys(RL_EVENTS).map(k => [k, RL_EVENTS[k].short]).concat([['custom', 'type your own']]))) +
    pkBoxes('rlev', st.ekey, st, [], RL_EV_BOUNDS,
      'Two events, as (t, x) with c = 1. Anything the expression engine understands.') +
    ctlRow('the observer\'s β', ctlSlider('rlTrB2', -0.98, 0.98, 0.005, st.beta)) +
    `<p class="help">The plot is <b>Δt′ against β</b>: where it crosses zero, the two events are
    simultaneous for that observer, and either side of the crossing they happen in opposite orders.
    A crossing exists only if the pair is <b>spacelike</b> — and that is the whole of causality.
    ${C.why || ''}</p>`;
}
function rlEvWire(){
  pkWire('rlTrE', 'rlev', ST.ekey, ST, [], RL_EV_BOUNDS, v => { ST.ekey = v; });
  wireSlider('rlTrB2', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
}
function rlEvFrame(st, ctx, W, H){
  const C = rlEvCur(st);
  const dt = C.t2 - C.t1, dx = C.x2 - C.x1;
  const X = rlEventCross(dt, dx);
  const P = rlPanes(W, H, 34);
  /* top: Δt′ against β — the theorem, drawn */
  const N = 400, bs = new Float64Array(N), ds = new Float64Array(N);
  let hi = 1e-9;
  for(let i = 0; i < N; i++){
    const b = -0.98 + 1.96 * i / (N - 1);
    bs[i] = b; ds[i] = relGamma(b) * (dt - b * dx);
    hi = Math.max(hi, Math.abs(ds[i]));
  }
  const A = mkPlot(P.top.x, P.top.y + 14, P.top.w, P.top.h - 38, -0.98, 0.98, -1.15 * hi, 1.15 * hi);
  plotFrame(ctx, A, 'the observer\'s β', 'Δt′ = γ(Δt − βΔx)',
    'Where this crosses zero, the two events swap order');
  plotZeroY(ctx, A);
  plotTicksX(ctx, A, [-0.98, -0.5, 0, 0.5, 0.98], v => fmtNum(v, 2));
  rlLine(ctx, A, bs, ds, rgbCss(TH.grad), 2.6);
  if(X.beta !== null){
    rlSegment(ctx, A.X(X.beta), A.py, A.X(X.beta), A.py + A.ph, rgbCss(TH.neg, 0.8), 1.6, [4, 4]);
    rlDot(ctx, A.X(X.beta), A.Y(0), 5, rgbCss(TH.neg));
    rlText(ctx, A.X(X.beta) + 8, A.py + 18, 'order flips at β = ' + fmtNum(X.beta, 5),
           rgbCss(TH.neg), '11px ' + FONT_MONO);
  } else {
    rlText(ctx, A.px + 8, A.py + 18, 'no crossing anywhere in (−1, 1) — the order is absolute',
           rgbCss(TH.pos), '11px ' + FONT_MONO);
  }
  rlSegment(ctx, A.X(st.beta), A.py, A.X(st.beta), A.py + A.ph, rgbCss(TH.pos, 0.55), 1.2, [4, 4]);

  /* bottom: the pair on a Minkowski diagram, in the reader's frame */
  const E = rlEventPair(C.t1, C.x1, C.t2, C.x2, st.beta);
  const tLo = Math.min(0, E.A.t, E.B.t), tHi = Math.max(E.A.t, E.B.t, 0.5);
  const xLo = Math.min(E.A.x, E.B.x), xHi = Math.max(E.A.x, E.B.x);
  const Bp = rlWlPane(P.bot.x + 10, P.bot.y + 18, P.bot.w - 20, P.bot.h - 46, xLo, xHi, tLo, tHi);
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.strokeRect(Bp.px, Bp.py, Bp.pw, Bp.ph);
  ctx.save(); ctx.beginPath(); ctx.rect(Bp.px, Bp.py, Bp.pw, Bp.ph); ctx.clip();
  const L = 4 * (Bp.pw + Bp.ph) / Bp.sc;
  for(const s of [1, -1]) for(const u of [1, -1])
    rlSegment(ctx, Bp.X(E.A.x), Bp.Y(E.A.t), Bp.X(E.A.x + s * L), Bp.Y(E.A.t + u * L),
              rgbCss(TH.warn, 0.5), 1.2);
  rlSegment(ctx, Bp.X(E.A.x), Bp.Y(E.A.t), Bp.X(E.B.x), Bp.Y(E.B.t), rgbCss(TH.curl, 0.7), 1.6, [4, 4]);
  rlDot(ctx, Bp.X(E.A.x), Bp.Y(E.A.t), 6, rgbCss(TH.grad), rgbCss(TH.bg));
  rlDot(ctx, Bp.X(E.B.x), Bp.Y(E.B.t), 6, rgbCss(TH.accent), rgbCss(TH.bg));
  ctx.restore();
  rlText(ctx, Bp.px + Bp.pw / 2, P.bot.y + 12,
    'the pair as an observer at β = ' + fmtNum(st.beta, 3) + ' plots it  ·  Δt′ = ' + fmtNum(E.dtp, 5) +
    (E.flipped ? '  — REVERSED' : ''),
    rgbCss(E.flipped ? TH.neg : TH.dim), '600 11.5px ' + FONT_UI, 'center');
  stageNote(ctx, X.beta !== null
    ? 'this pair is ' + X.kind + ', so some observer sees it either way round — and none of them can be signalled between'
    : 'this pair is ' + X.kind + ', so every observer agrees which came first', W, H);
}
function rlEvReadout(st){
  const C = rlEvCur(st);
  const dt = C.t2 - C.t1, dx = C.x2 - C.x1;
  const X = rlEventCross(dt, dx);
  const E = rlEventPair(C.t1, C.x1, C.t2, C.x2, st.beta);
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('event 1  (t, x)', '(' + fmtNum(C.t1, 5) + ', ' + fmtNum(C.x1, 5) + ')')}
    ${kv('event 2  (t, x)', '(' + fmtNum(C.t2, 5) + ', ' + fmtNum(C.x2, 5) + ')')}
    ${kv('Δt, Δx', fmtNum(dt, 6) + ',  ' + fmtNum(dx, 6))}
    ${kv('s² = Δt² − Δx²', fmtNum(X.s2, 7))}
    ${kv('so the pair is', X.kind)}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">Can any observer see them the other way round?</div>
    ${X.beta !== null
      ? kv('yes — the order flips at β', fmtNum(X.beta, 8)) + kv('which is Δt/Δx', fmtNum(dt / dx, 8))
      : kv('no', 'and the reason is below')}
    ${kv('at your β = ' + fmtNum(st.beta, 4) + ',  Δt′', fmtNum(E.dtp, 8) +
        (E.flipped ? '  — reversed' : dt === 0 ? '' : '  — same order'))}
    ${kv('and Δx′', fmtNum(E.dxp, 8))}
    ${kv("s² in the observer's frame", fmtNum(E.s2p, 8))}
    ${kv('difference', fmtAgreeGross(E.s2p, E.s2, Math.abs(E.dtp * E.dtp) + Math.abs(E.dxp * E.dxp)))}
    <p class="help">${X.beta !== null
      ? 'A crossing exists inside (−1, 1) <b>because and only because</b> |Δx| > |Δt|. Those are the same ' +
        'statement: β = Δt/Δx is a legal boost exactly when the pair is spacelike. And a spacelike pair ' +
        'is one no signal can connect, so nothing that could be influenced is being reordered — ' +
        'causality survives having simultaneity taken away from it, and this is how.'
      : X.why}</p>
    <p class="help">Whatever the order does, <b>s²</b> does not move. That is the number both observers
    agree on, and it is the one that decides whether the question "which came first?" has an answer at
    all.</p>
  </div>`;
}
function rlEvChip(st){
  const C = rlEvCur(st);
  const dt = C.t2 - C.t1, dx = C.x2 - C.x1;
  const X = rlEventCross(dt, dx);
  const E = rlEventPair(C.t1, C.x1, C.t2, C.x2, st.beta);
  return `<div class="k">Event pair</div>
    <div style="color:var(--c-grad)">${X.kind}</div>
    <div style="color:var(--accent)">Δt′ = ${fmtNum(E.dtp, 5)}</div>
    <div style="color:${X.beta !== null ? 'var(--c-neg)' : 'var(--c-pos)'}">${
      X.beta !== null ? 'flips at β = ' + fmtNum(X.beta, 4) : 'order is absolute'}</div>`;
}

/* ---- item 17 · the closing rate ------------------------------------------- */

const RL_CH_BOUNDS = [{ k:'bs', label:'the signal\'s β =', def:1 }];
function rlChControls(st){
  const own = pkOwn(st, 'rlch', [], RL_CH_BOUNDS);
  return ctlRow('your speed β', ctlSlider('rlChB', 0, 0.995, 0.005, st.beta)) +
    pkBoxes('rlch', 'custom', st, [], RL_CH_BOUNDS,
      'What you are chasing: <b>1</b> for light, <b>0.9</b> for a fast particle, ' +
      '<b>-1</b> for a signal coming the other way.') +
    `<p class="help">Two numbers, both correct, answering different questions. The <b>coordinate gap</b>
    between you and the signal shrinks at β_s − β in the lab — that is a rate of change of a difference
    of positions, and it is nobody's velocity, which is why it may exceed c. What <b>you</b> measure is
    (β_s − β)/(1 − β_s β), and for light that is exactly 1 however hard you chase.</p>`;
}
function rlChWire(){
  wireSlider('rlChB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
  pkWireBoxes('rlch', 'custom', ST, [], RL_CH_BOUNDS);
}
function rlChFrame(st, ctx, W, H){
  const own = pkOwn(st, 'rlch', [], RL_CH_BOUNDS);
  const bs = Math.max(-1, Math.min(1, +own.bs));
  const P = rlPanes(W, H, 34);
  const N = 400, xs = new Float64Array(N), lab = new Float64Array(N), me = new Float64Array(N);
  for(let i = 0; i < N; i++){
    const b = -0.995 + 1.99 * i / (N - 1);
    xs[i] = b;
    const R = rlCloseRate(b, bs);
    lab[i] = R.lab; me[i] = R.own;
  }
  const A = mkPlot(P.top.x, P.top.y + 14, P.top.w, P.top.h - 38, -0.995, 0.995, -2.2, 2.2);
  plotFrame(ctx, A, 'your speed β', 'closing rate',
    'Chasing something at β_s = ' + fmtNum(bs, 4) + ': two right answers');
  plotZeroY(ctx, A);
  plotTicksX(ctx, A, [-0.99, -0.5, 0, 0.5, 0.99], v => fmtNum(v, 2));
  rlYTicks(ctx, A, [-2, -1, 0, 1, 2]);
  for(const lv of [1, -1])
    rlSegment(ctx, A.px, A.Y(lv), A.px + A.pw, A.Y(lv), rgbCss(TH.warn, 0.8), 1.4, [5, 4]);
  rlLine(ctx, A, xs, lab, rgbCss(TH.faint, 0.9), 2, [5, 4]);
  rlLine(ctx, A, xs, me, rgbCss(TH.grad), 2.6);
  const R = rlCloseRate(st.beta, bs);
  rlSegment(ctx, A.X(st.beta), A.py, A.X(st.beta), A.py + A.ph, rgbCss(TH.pos, 0.5), 1.2, [4, 4]);
  rlDot(ctx, A.X(st.beta), A.Y(Math.max(-2.2, Math.min(2.2, R.own))), 5.5, rgbCss(TH.grad));
  rlDot(ctx, A.X(st.beta), A.Y(Math.max(-2.2, Math.min(2.2, R.lab))), 4, rgbCss(TH.faint));
  rlText(ctx, A.px + 8, A.py + 18,
    'what you measure: ' + fmtNum(R.own, 8) + '   ·   the coordinate gap: ' + fmtNum(R.lab, 6),
    rgbCss(TH.grad), '11px ' + FONT_MONO);

  /* bottom: the same thing as a picture of the gap over time */
  const B = mkPlot(P.bot.x, P.bot.y + 14, P.bot.w, P.bot.h - 38, 0, 4, -0.2, 4.4);
  plotFrame(ctx, B, 'lab time', 'position',
    'You and the signal, drawn — the gap in the lab, and what you measure');
  plotTicksX(ctx, B, [0, 1, 2, 3, 4], v => fmtNum(v, 2));
  rlYTicks(ctx, B, [0, 1, 2, 3, 4]);
  const M = 200, ts = new Float64Array(M), ys = new Float64Array(M), zs = new Float64Array(M);
  for(let i = 0; i < M; i++){
    const t = 4 * i / (M - 1);
    ts[i] = t; ys[i] = st.beta * t; zs[i] = 0.4 + bs * t;
  }
  rlLine(ctx, B, ts, ys, rgbCss(TH.pos), 2.4);
  rlLine(ctx, B, ts, zs, rgbCss(TH.warn), 2.4);
  rlText(ctx, B.px + B.pw - 8, B.py + 15, 'you (β = ' + fmtNum(st.beta, 3) + ')  ·  the signal',
         rgbCss(TH.dim), '11px ' + FONT_MONO, 'right');
  stageNote(ctx, 'the dashed grey curve is the coordinate gap closing — it is not a velocity, and it may exceed c  ·  ' +
    'the solid one is what you actually measure, and for light it is flat at 1', W, H);
}
function rlChReadout(st){
  const own = pkOwn(st, 'rlch', [], RL_CH_BOUNDS);
  const bs = Math.max(-1, Math.min(1, +own.bs));
  const R = rlCloseRate(st.beta, bs);
  const isLight = Math.abs(Math.abs(bs) - 1) < 1e-12;
  return `<div class="card tight"><div class="ttl">Chasing something at β = ${fmtNum(bs, 5)}</div>
    ${kv('your speed', fmtNum(st.beta, 5) + ' c')}
    ${kv('the coordinate gap shrinks at', fmtNum(R.lab, 8) + ' c')}
    ${kv('what you measure it receding at', fmtNum(R.own, 10) + ' c')}
    ${kv('γ of your motion', fmtNum(relGamma(st.beta), 6))}
    <p class="help">${isLight
      ? 'The signal is <b>light</b>, so the second number is exactly 1 for every β you choose — that is ' +
        'the postulate, and here it is arithmetic. The first number is 1 − β and can be made as small ' +
        'as you like: the gap in <i>lab coordinates</i> closes slowly, and you still measure the light ' +
        'going past you at c. The two are not in conflict because the first is not anybody\'s velocity.'
      : 'A signal slower than light behaves the way intuition expects at low β and does not at high β: ' +
        'the two numbers separate. Set it to <b>1</b> and the second one goes flat at exactly 1, for ' +
        'every chase speed there is.'}</p>
  </div>
  <div class="card tight"><div class="ttl">And why one of them may exceed c</div>
    ${kv('head-on, both at 0.9c: the lab gap closes at', fmtNum(rlCloseRate(-0.9, 0.9).lab, 6))}
    ${kv('while either one measures the other at', fmtNum(rlCloseRate(-0.9, 0.9).own, 8))}
    <p class="help">A closing rate is the derivative of a <b>difference of two positions</b>, both
    measured in one frame at one time. Nothing is at that speed — there is no object whose worldline has
    that slope — so the light barrier has nothing to say about it. Two beams approaching head-on close
    at exactly 2 in the lab, and each still measures the other passing at 1. The quantity relativity
    bounds is the speed of a <i>thing</i>, and this is not one.</p>
  </div>`;
}
function rlChChip(st){
  const own = pkOwn(st, 'rlch', [], RL_CH_BOUNDS);
  const bs = Math.max(-1, Math.min(1, +own.bs));
  const R = rlCloseRate(st.beta, bs);
  return `<div class="k">Closing rate</div>
    <div style="color:var(--faint)">lab gap ${fmtNum(R.lab, 5)}</div>
    <div style="color:var(--c-grad)">you measure ${fmtNum(R.own, 8)}</div>`;
}
