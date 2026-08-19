/* ============================================================================
   GROUP 2b · A WORLDLINE THE READER WRITES
   The panel half of Programme A item 10; the arithmetic is in 46e-sr-frames.js.
   Split out of 66c because that file was past its size budget once the second
   mode landed, and this is a self-contained mode of one stage.
   ============================================================================ */

/* ---- 7b · the same diagram, with a whole worldline in it -------------------
   Programme A item 10. The event mode above boosts one point and shows that s²
   does not move. This one boosts a CURVE the reader writes, and measures the
   quantity a curve has that a point does not: its length, which is the proper
   time of whoever follows it. Two routes (46e), and the geometry statement that
   the straight route is the longest — which is the twin paradox with nothing
   left in it but arithmetic. */

/* the measurement, cached against everything that can change it: route B costs
   about ten milliseconds and frame() must never wait on it */
function rlMinkWlMeasure(st){
  const W = rlWlCur(st);
  const key = W.src + '|' + W.t0 + '|' + W.t1 + '|' + st.beta;
  if(st._wl && st._wl.key === key) return st._wl;
  const pf = pkParamFn(W.src), pd = pkParamD(W.src, 1);
  const f = t => pf(t, 1), d = t => pd(t, 1);
  const M = rlWlMeasure(f, d, W.t0, W.t1, st.beta);
  M.key = key; M.W = W; M.f = f; M.d = d;
  st._wl = M;
  return M;
}
/* the cheap half — everything frame() is allowed to ask for */
function rlMinkWlDraw(st){
  const W = rlWlCur(st);
  const pf = pkParamFn(W.src);
  const f = t => pf(t, 1);
  const t0 = Number.isFinite(+W.t0) ? +W.t0 : 0;
  const t1 = Number.isFinite(+W.t1) && +W.t1 > t0 ? +W.t1 : t0 + 4;
  return { W, f, t0, t1 };
}

/* One square pane with EQUAL scales on both axes. That is not a style choice:
   the light cone is at 45° only if a second and a light-second are the same
   number of pixels, and a Minkowski diagram with unequal scales is drawing a
   different geometry from the one it is talking about. */
function rlWlPane(px, py, pw, ph, xLo, xHi, tLo, tHi){
  const padX = 0.12 * Math.max(1e-9, xHi - xLo), padT = 0.12 * Math.max(1e-9, tHi - tLo);
  let x0 = xLo - padX, x1 = xHi + padX, T0 = tLo - padT, T1 = tHi + padT;
  /* A worldline that barely moves is 0.6 wide and 4 tall, and at equal scales
     that is a thin vertical ribbon with a frame drawn round the empty half of
     the canvas. The cure is to widen the WINDOW, never the scale: showing more
     empty space is honest, and stretching x would put the light cone at some
     angle other than 45° and quietly draw a different geometry. */
  const AR = 0.62;
  let wx = x1 - x0, wt = T1 - T0;
  if(wx < AR * wt){ const g = (AR * wt - wx) / 2; x0 -= g; x1 += g; wx = x1 - x0; }
  if(wt < AR * wx){ const g = (AR * wx - wt) / 2; T0 -= g; T1 += g; wt = T1 - T0; }
  const sc = Math.min(pw / wx, ph / wt);
  const bw = wx * sc, bh = wt * sc;
  const bx = px + (pw - bw) / 2, by = py + (ph - bh) / 2;
  return { px:bx, py:by, pw:bw, ph:bh, sc,
    X: x => bx + (x - x0) * sc,
    Y: t => by + bh - (t - T0) * sc };
}
function rlWlPolyDraw(ctx, P, ts, xs, col, w, dash){
  ctx.save(); ctx.beginPath();
  ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
  ctx.strokeStyle = col; ctx.lineWidth = w || 2;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  for(let i = 0; i < ts.length; i++){
    const X = P.X(xs[i]), Y = P.Y(ts[i]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

function rlMinkWlControls(st){
  const W = rlWlCur(st);
  return ctlRow('the worldline', pkSeg('rlMkW', RL_WORLDLINES, st.wkey, e => e.short || e.name)) +
    pkBoxes('rlwl', st.wkey, st, RL_WL_SLOTS, RL_WL_BOUNDS,
      'Anything the expression engine understands, written in <b>t</b> — <b>0.5*t</b>, ' +
      '<b>0.6*sin(pi*t/2)</b>, <b>0.9*tanh(t)</b>, <b>t^2/8</b>. Units have c = 1, so the ' +
      'slope <i>is</i> the speed and it must stay under 1 everywhere; if it does not, the panel ' +
      'says where it broke rather than drawing you a nonsense number.') +
    ctlRow('boost β', ctlSlider('rlMkB', -0.95, 0.95, 0.005, st.beta)) +
    `<p class="help">The left picture is the worldline as the lab draws it; the right one is
     <b>the same events</b> plotted in the coordinates of an observer moving at β. Nothing is
     recomputed for the second picture — the events are boosted and re-plotted. What is measured is
     the <b>proper time</b> along the curve, twice: once by the lab's integral, and once by the
     moving observer working from the boosted events alone, with no derivative shared between them.
     They must agree, because proper time is the length of the worldline and length is not an
     opinion. ${W.why || ''}</p>`;
}
function rlMinkWlWire(){
  pkWire('rlMkW', 'rlwl', ST.wkey, ST, RL_WL_SLOTS, RL_WL_BOUNDS,
         v => { ST.wkey = v; ST._wl = null; }, () => { ST._wl = null; });
  wireSlider('rlMkB', () => ST.beta, v => { ST.beta = v; ST._wl = null; }, rlBetaFmt, RL_BETA_LIM);
}

function rlMinkWlFrame(st, ctx, W, H){
  const D = rlMinkWlDraw(st);
  const b = Math.abs(st.beta) < 1 ? st.beta : 0.95 * Math.sign(st.beta);
  const N = 240, ts = new Float64Array(N + 1), xs = new Float64Array(N + 1);
  const h = (D.t1 - D.t0) / N;
  let xLo = Infinity, xHi = -Infinity, bad = 0;
  for(let i = 0; i <= N; i++){
    const t = D.t0 + i * h, x = D.f(t);
    ts[i] = t; xs[i] = Number.isFinite(x) ? x : 0;
    if(!Number.isFinite(x)) bad++;
    else { xLo = Math.min(xLo, x); xHi = Math.max(xHi, x); }
  }
  if(!Number.isFinite(xLo)){ xLo = -1; xHi = 1; }
  const K = rlWlPrimedTrack(D.f, D.t0, D.t1, b, N);
  let pxLo = Infinity, pxHi = -Infinity, ptLo = Infinity, ptHi = -Infinity;
  for(let i = 0; i <= N; i++){
    if(!Number.isFinite(K.xp[i]) || !Number.isFinite(K.tp[i])) continue;
    pxLo = Math.min(pxLo, K.xp[i]); pxHi = Math.max(pxHi, K.xp[i]);
    ptLo = Math.min(ptLo, K.tp[i]); ptHi = Math.max(ptHi, K.tp[i]);
  }
  if(!Number.isFinite(pxLo)){ pxLo = -1; pxHi = 1; ptLo = 0; ptHi = 1; }

  const gap = 26, top = 52, bot = 46;
  const pw = (W - 3 * gap) / 2, ph = Math.max(80, H - top - bot);
  const A = rlWlPane(gap, top, pw, ph, xLo, xHi, D.t0, D.t1);
  const B = rlWlPane(2 * gap + pw, top, pw, ph, pxLo, pxHi, ptLo, ptHi);

  const draw = (P, tt, xx, primed) => {
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(P.px, P.py, P.pw, P.ph);
    /* the light cone through the first event — 45° in both panes, which is the
       whole reason the scales are locked together */
    ctx.save(); ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    const L = 4 * (P.pw + P.ph) / P.sc;
    for(const s of [1, -1])
      rlSegment(ctx, P.X(xx[0]), P.Y(tt[0]), P.X(xx[0] + s * L), P.Y(tt[0] + L),
                rgbCss(TH.warn, 0.75), 1.6);
    ctx.restore();
    /* the inscribed polygon, deliberately coarse so it reads as one */
    const M = 8, pt = [], px2 = [];
    for(let k = 0; k <= M; k++){
      const i = Math.round(k * N / M);
      pt.push(tt[i]); px2.push(xx[i]);
    }
    rlWlPolyDraw(ctx, P, pt, px2, rgbCss(TH.faint, 0.85), 1.4, [5, 4]);
    /* the straight route between the same two events */
    rlWlPolyDraw(ctx, P, [tt[0], tt[N]], [xx[0], xx[N]], rgbCss(TH.accent, 0.9), 1.8, [2, 3]);
    rlWlPolyDraw(ctx, P, tt, xx, rgbCss(primed ? TH.pos : TH.grad), 2.6);
    rlDot(ctx, P.X(xx[0]), P.Y(tt[0]), 5, rgbCss(TH.grad), rgbCss(TH.bg));
    rlDot(ctx, P.X(xx[N]), P.Y(tt[N]), 5, rgbCss(TH.grad), rgbCss(TH.bg));
    rlText(ctx, P.px + P.pw - 6, P.py + P.ph - 8, primed ? 'x′' : 'x',
           rgbCss(TH.dim), '600 12px ' + FONT_MONO, 'right');
    rlText(ctx, P.px + 6, P.py + 14, primed ? 'ct′' : 'ct',
           rgbCss(TH.dim), '600 12px ' + FONT_MONO);
  };
  draw(A, ts, xs, false);
  draw(B, K.tp, K.xp, true);

  /* the numbers frame() is allowed to compute: the lab integral is a
     millisecond, the polygon is microseconds, and the polygon is the same
     number in both frames because every chord's interval is separately
     invariant. Route B is NOT computed here — it costs ten milliseconds, and a
     β slider being dragged would pay it sixty times a second. */
  const pd = pkParamD(D.W.src, 1);
  const A1 = rlWlTauLab(t => pd(t, 1), D.t0, D.t1);
  const pA = rlWlPolygon(D.f, D.t0, D.t1, 8, 0).tau;
  const pB = rlWlPolygon(D.f, D.t0, D.t1, 8, b).tau;
  const ok = Number.isFinite(A1.tau) && !A1.bad;
  const cap = (P, y, s, col, font) => {
    ctx.font = font;
    rlText(ctx, ctTitleClearChip(ctx, P.px + P.pw / 2, y, s), y, s, rgbCss(col), font, 'center');
  };
  cap(A, top - 32, 'as the lab draws it', TH.grad, '600 12.5px ' + FONT_UI);
  cap(B, top - 32, 'as an observer at β = ' + fmtNum(b, 3) + ' draws it', TH.pos, '600 12.5px ' + FONT_UI);
  cap(A, top - 14, ok ? 'proper time along it  τ = ' + fmtNum(A1.tau, 6)
                      : 'it reaches the speed of light — no proper time along it',
      ok ? TH.dim : TH.neg, '11.5px ' + FONT_MONO);
  cap(B, top - 14, 'the 8-chord polygon differs by ' + fmtAgreeTight(pB, pA) + ' between the frames',
      TH.dim, '11.5px ' + FONT_MONO);
  stageNote(ctx, bad ? 'x(t) has no value somewhere on that interval'
    : 'dashed grey is the inscribed polygon — in this geometry it is LONGER than the curve  ·  ' +
      'dotted is the straight route, and nothing beats it', W, H);
}

function rlMinkWlReadout(st){
  const M = rlMinkWlMeasure(st);
  const W = M.W;
  const head = `<div class="card tight"><div class="ttl">${esc(W.name)}</div>
    ${kv('x(t)', supify(W.ex || pkPretty(W.src)))}
    ${kv('over', fmtNum(W.t0, 4) + ' ≤ t ≤ ' + fmtNum(W.t1, 4))}
    ${kv('boost of the second observer', fmtNum(st.beta, 4) + ' c')}`;
  if(!M.ok)
    return head + `<p class="help" style="color:var(--c-neg)">${M.why}</p></div>`;
  const straightZero = Math.abs(M.deficit) <= 1e-12 * Math.max(1e-30, M.straight);
  return head +
    `${kv('largest |dx/dt| on it', fmtNum(M.vmax, 6) + ' c,  at t = ' + fmtNum(M.vat, 4))}
    <p class="help">The top speed is <b>scanned for and then refined</b>, not read off the formula:
    the largest sample of a grid is not the largest value, and a worldline can poke through the light
    cone between two samples. ${W.why || ''}</p>
    </div>
    <div class="card tight"><div class="ttl">Proper time, measured twice</div>
      ${kv('the lab integrates ∫√(1 − ẋ²)dt', fmtNum(M.tauLab, 9))}
      ${kv("the moving observer integrates ∫√(1 − ẋ′²)dt′", fmtNum(M.tauP, 9))}
      ${kv('difference', fmtAgree(M.tauLab, M.tauP))}
      ${W.tau !== null && W.tau !== undefined
        ? kv('and the closed form says', fmtNum(W.tau, 9) + '  ·  ' + fmtAgree(M.tauLab, W.tau)) : ''}
      ${kv("the moving observer's elapsed t′", fmtNum(M.t1p - M.t0p, 7))}
      <p class="help">The second route is not the first one rearranged. It <b>inverts</b> t′(t) by
      bisection, so it only ever evaluates x(t) and never the derivative; it differentiates x′ against
      t′ numerically; and it integrates on its own adaptive grid in t′. The two share the worldline and
      nothing else. Note the elapsed <i>coordinate</i> time in the moving frame is a different number
      from the lab's ${fmtNum(W.t1 - W.t0, 6)} — and the proper time is not.</p>
    </div>
    <div class="card tight"><div class="ttl">Nothing beats the straight route</div>
      ${kv('straight between the same two events', fmtNum(M.straight, 9))}
      ${kv('your worldline', fmtNum(M.tauLab, 9))}
      ${kv('shortfall', straightZero
          ? '0 — this worldline is straight, so it is the straight route'
          : fmtSig(M.deficit, 6) + '  (' + fmtSig(100 * M.deficit / M.straight, 3) + '% less)')}
      ${kv('the 400-chord polygon', fmtNum(M.polyLab, 9) + '  ·  above by ' + fmtSig(M.polyLab - M.tauLab, 3))}
      ${kv('the same polygon in the moving frame', fmtAgree(M.polyP, M.polyLab))}
      ${kv('endpoint interval s², lab', fmtNum(M.s2Lab, 8))}
      ${kv('endpoint interval s², moving frame', fmtAgree(M.s2P, M.s2Lab))}
      <p class="help">Every chord of the polygon is a <b>straight</b> route between two events on the
      curve, and in this geometry the straight route between two events is the <b>longest</b> — so the
      polygon comes out above the curve and falls onto it as the chords shorten. That is the reverse of
      the Euclidean case, and it is the entire twin paradox: the twin who stays put takes the straight
      route and ages the most. ${straightZero ? '' : 'The ' +
      fmtSig(100 * M.deficit / M.straight, 3) + '% here is what your traveller loses.'}</p>
    </div>`;
}

function rlMinkWlChip(st){
  const M = rlMinkWlMeasure(st);
  if(!M.ok) return `<div class="k">Worldline</div>
    <div style="color:var(--c-neg)">faster than light</div>`;
  return `<div class="k">Worldline</div>
    <div style="color:var(--c-grad)">τ = ${fmtNum(M.tauLab, 6)}</div>
    <div style="color:var(--c-pos)">two frames: ${fmtAgreeTight(M.tauLab, M.tauP)}</div>
    <div style="color:var(--accent)">straight route ${fmtNum(M.straight, 5)}</div>`;
}

function rlMinkWlDerive(st){
  const M = rlMinkWlMeasure(st);
  const n = v => fmtNum(v, 6);
  return {
    title:'Proper time is the length of a worldline, and length is not an opinion',
    steps:[
      drvSay('a curve has something a point does not',
        'The event mode shows that s² between two events survives a boost. A worldline is a continuum of events, and what survives for it is the total — the wristwatch time of whoever follows the curve. Every clock argument in this wing is a special case of that one statement.'),
      drvStep('the proper time along a worldline',
        `${dv('τ')} ${dop('=')} ∫ √(1 ${dop('−')} ${dv('ẋ')}²) ${dv('dt')}`,
        M.ok ? `for this worldline the lab gets ${n(M.tauLab)} over ${n(M.W.t1 - M.W.t0)} of coordinate time`
             : 'not defined here — this worldline reaches the speed of light'),
      drvSay('and it is arc length in a geometry with one sign flipped',
        'Euclidean arc length adds dx² and dy². This subtracts. Everything strange about the answer — that the straight route is longest, that a polygon overshoots — is that minus sign and nothing else.'),
      drvStep('the moving observer has the same events and different coordinates',
        `${dv('t')}′ ${dop('=')} γ(${dv('t')} ${dop('−')} β${dv('x')}), &nbsp; ${dv('x')}′ ${dop('=')} γ(${dv('x')} ${dop('−')} β${dv('t')})`,
        M.ok ? `their coordinate time runs ${n(M.t1p - M.t0p)} where the lab's runs ${n(M.W.t1 - M.W.t0)}`
             : 'the boost is applied to the events themselves, not to the answer'),
      drvStep('so they do their own integral, and it is the same number',
        `${dv('τ')}′ ${dop('=')} ∫ √(1 ${dop('−')} (${dv('dx')}′/${dv('dt')}′)²) ${dv('dt')}′`,
        M.ok ? `they get ${n(M.tauP)} — the two differ by ${fmtAgree(M.tauLab, M.tauP)}`
             : 'not computed — the worldline is not timelike'),
      drvSay('and the second route deliberately shares no arithmetic with the first',
        'Rewriting the primed integral back in t makes the γ factors cancel algebraically, and then it agrees to the last bit whatever the physics — a test that cannot fail is not a test. So the second route inverts t′(t) numerically, never touches the analytic derivative, and integrates on its own grid.'),
      drvStep('the reverse triangle inequality',
        `${dv('τ')} ${dop('≤')} √(Δ${dv('t')}² ${dop('−')} Δ${dv('x')}²)`,
        M.ok ? (Math.abs(M.deficit) <= 1e-12 * M.straight
          ? 'equality here — this worldline is straight'
          : `${n(M.straight)} against ${n(M.tauLab)}: your traveller loses ${fmtSig(M.deficit, 4)}`)
             : 'the endpoints must be timelike separated for this to say anything'),
      drvSay('which is the twin paradox, with nothing left in it',
        'The twin who stays put follows the straight worldline between the two meetings and ages the most. There is no asymmetry to hunt for and no acceleration to blame: a straight line is simply the longest route between two timelike-separated events, and any detour costs proper time. The panel measures the cost for whatever curve you wrote.')
    ],
    note:'The proper time is integrated in the lab frame and re-integrated by an observer moving at β from the boosted events alone, and the difference is printed with its scale. The inscribed polygon is computed in both frames as well: every chord\'s interval is separately invariant, so that number cannot move at all.'
  };
}
