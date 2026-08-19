/* ============================================================================
   GROUP 1c · THE LAST THREE THOUGHT EXPERIMENTS, WITH THE READER'S NUMBERS
   The panel half of Programme A relativity items 16 (`rlBarn`), 20
   (`rlElevator`) and 21 (`rlDisk`); the arithmetic is in 46j-sr-geometry.js.
   ============================================================================ */

/* ---- item 16 · the ladder and the barn ------------------------------------ */

function rlBarnControls(st){
  const C = rlBarnCur(st);
  return ctlRow('the setup', ctSeg('rlBaK', st.bkey,
      Object.keys(RL_BARNS).map(k => [k, RL_BARNS[k].short]).concat([['custom', 'type your own']]))) +
    pkBoxes('rlbarn', st.bkey, st, [], RL_BARN_BOUNDS,
      'Proper lengths, and the speed. The ladder fits when L/γ ≤ B — in the <b>barn\'s</b> frame.') +
    `<p class="help">The paradox is not about lengths, it is about four <b>events</b>: each end of the
    ladder passing each door. The panel writes them down in the barn's frame, transforms them into the
    ladder's, and computes the same thing again from the ladder's own geometry with no boost in it.
    ${C.why || ''}</p>`;
}
function rlBarnWire(){
  pkWire('rlBaK', 'rlbarn', ST.bkey, ST, [], RL_BARN_BOUNDS, v => { ST.bkey = v; });
}
function rlBarnFrame(st, ctx, W, H){
  const C = rlBarnCur(st);
  const E = rlBarnEvents(C.L, C.B, C.beta);
  if(!E.ok){ rlText(ctx, W / 2, H / 2, E.why, rgbCss(TH.neg), '12px ' + FONT_UI, 'center'); return; }
  const gap = 26, top = 54, bot = 74;
  const pw = (W - 3 * gap) / 2, ph = Math.max(80, H - top - bot);
  const keys = ['frontIn', 'backIn', 'frontOut', 'backOut'];
  const cols = { frontIn:TH.grad, backIn:TH.pos, frontOut:TH.accent, backOut:TH.curl };
  const draw = (px, get, title, tint) => {
    let tLo = Infinity, tHi = -Infinity, xLo = Infinity, xHi = -Infinity;
    for(const k of keys){
      const e = get(k);
      tLo = Math.min(tLo, e.t); tHi = Math.max(tHi, e.t);
      xLo = Math.min(xLo, e.x); xHi = Math.max(xHi, e.x);
    }
    const P = rlWlPane(px, top, pw, ph, xLo, xHi, tLo, tHi);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(P.px, P.py, P.pw, P.ph);
    ctx.save(); ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    /* the light cone from the near-door closing, so the reader can see whether
       the other closing is inside it — which is the whole question */
    const n = get('backIn'), L = 4 * (P.pw + P.ph) / P.sc;
    for(const s of [1, -1]) for(const u of [1, -1])
      rlSegment(ctx, P.X(n.x), P.Y(n.t), P.X(n.x + s * L), P.Y(n.t + u * L), rgbCss(TH.warn, 0.45), 1.2);
    for(const k of keys){
      const e = get(k);
      rlDot(ctx, P.X(e.x), P.Y(e.t), 5.5, rgbCss(cols[k]), rgbCss(TH.bg));
    }
    ctx.restore();
    ctx.font = '600 12.5px ' + FONT_UI;
    rlText(ctx, ctTitleClearChip(ctx, P.px + P.pw / 2, top - 32, title), top - 32, title,
           rgbCss(tint), '600 12.5px ' + FONT_UI, 'center');
    rlText(ctx, P.px + P.pw / 2, top - 14,
           'the two closings: Δt = ' + fmtNum(get('frontOut').t - get('backIn').t, 5),
           rgbCss(TH.dim), '11px ' + FONT_MONO, 'center');
    return P;
  };
  draw(gap, k => E.barn[k], 'the barn\'s frame', TH.grad);
  draw(2 * gap + pw, k => E.ladder[k], 'the ladder\'s frame', TH.pos);

  let by = top + ph + 16;
  const bw = Math.min(W - 2 * gap - 8, 680);
  const line = (lbl, val, col) => {
    rlText(ctx, gap + 4, by, lbl, rgbCss(TH.dim), '11px ' + FONT_UI);
    rlText(ctx, gap + 4 + bw, by, val, rgbCss(col), '11px ' + FONT_MONO, 'right');
    by += 18;
  };
  line('the ladder, contracted, against the barn',
       fmtNum(E.Lc, 6) + ' vs ' + fmtNum(C.B, 6) + '   ' + (E.fits ? 'it fits' : 'it does NOT fit'),
       E.fits ? TH.pos : TH.neg);
  line('the two door-closings are',
       (E.s2Doors < -1e-12 ? 'spacelike — so their order is a matter of frame'
        : E.s2Doors > 1e-12 ? 'timelike — so every frame agrees which shut first'
        : 'exactly lightlike — the boundary case') + '   s² = ' + fmtNear(E.s2Doors),
       E.s2Doors < 0 ? TH.warn : TH.pos);
  /* no colour names in captions — see the disk note below and CLAUDE.md's J7 */
  stageNote(ctx, 'the cone is drawn from the near-door closing  ·  ' +
    'if the far one is outside it, no signal connects them and their order is not a fact about the world', W, H);
}
function rlBarnReadout(st){
  const C = rlBarnCur(st);
  const E = rlBarnEvents(C.L, C.B, C.beta);
  if(!E.ok) return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    <p class="help" style="color:var(--c-neg)">${E.why}</p></div>`;
  const kind = E.s2Doors < -1e-12 ? 'spacelike' : E.s2Doors > 1e-12 ? 'timelike' : 'lightlike';
  const ev = (lbl, a, b) => kv(lbl, '(' + fmtNum(a.t, 5) + ', ' + fmtNum(a.x, 5) + ')   →   (' +
                               fmtNum(b.t, 5) + ', ' + fmtNum(b.x, 5) + ')');
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('ladder, at rest', fmtNum(C.L, 5))}
    ${kv('barn, at rest', fmtNum(C.B, 5))}
    ${kv('β, γ', fmtNum(C.beta, 4) + ',  ' + fmtNum(E.g, 6))}
    ${kv('ladder in the barn frame', fmtNum(E.Lc, 6) + (E.fits ? '  — it fits' : '  — too long'))}
    ${kv('barn in the ladder frame', fmtNum(E.Bc, 6) + '  — and the ladder is ' + fmtNum(C.L, 5))}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">The four events, in both frames</div>
    <p class="help" style="margin-top:0">(t, x) in the barn's frame → (t′, x′) in the ladder's</p>
    ${ev('front reaches the near door', E.barn.frontIn, E.ladder.frontIn)}
    ${ev('back clears the near door', E.barn.backIn, E.ladder.backIn)}
    ${ev('front reaches the far door', E.barn.frontOut, E.ladder.frontOut)}
    ${ev('back leaves the far door', E.barn.backOut, E.ladder.backOut)}
    ${kv('the two closings, in the barn', 'Δt = ' + fmtNum(E.dtBarn, 8))}
    ${kv('the two closings, in the ladder', 'Δt′ = ' + fmtNum(E.dtLadder, 8))}
    ${kv("the same, from the ladder's own geometry", fmtNum(E.dtLadderOwn, 8))}
    ${kv('difference', fmtAgreeGross(E.dtLadder, E.dtLadderOwn, Math.abs(C.L / C.beta)))}
    <p class="help">The second route has <b>no boost in it</b>: in the ladder's frame the ladder is
    ${fmtNum(C.L, 4)} long at rest, the barn is ${fmtNum(E.Bc, 4)} long and sweeping past, and the two
    closings are (Bc − L)/β apart. That it matches the transformed answer is the check.</p>
  </div>
  <div class="card tight"><div class="ttl">And what the two frames must agree about</div>
    ${kv('s² between the two closings, barn frame', fmtNear(E.s2Doors))}
    ${kv('s² in the ladder frame', fmtAgreeGross(E.s2DoorsL, E.s2Doors, Math.abs(C.B * C.B)))}
    ${kv('so the pair is', kind)}
    <p class="help">${kind === 'spacelike'
      ? 'No signal could have travelled between the two closings, so their order is <b>not a fact about ' +
        'the world</b> — the barn frame may even call them simultaneous, and the ladder frame will not. ' +
        'And the question that <i>is</i> a fact — did anything hit anything? — has one answer, because a ' +
        'collision is an event and events do not care who is looking.'
      : kind === 'timelike'
      ? 'Here the two closings are close enough in space and far enough apart in time that a signal ' +
        'could have gone from one to the other — so <b>every</b> frame agrees which shut first, and ' +
        'there is no paradox to resolve. The paradox needs L/γ > B(1−β); this setup does not have it.'
      : 'Exactly on the light cone: a ray leaving the first closing arrives at the second as it happens. ' +
        'This is the boundary between "the order is a matter of frame" and "the order is absolute", and ' +
        'the numbers land on it precisely when L/γ = B(1−β).'}</p>
  </div>`;
}
function rlBarnChip(st){
  const C = rlBarnCur(st);
  const E = rlBarnEvents(C.L, C.B, C.beta);
  if(!E.ok) return `<div class="k">Ladder &amp; barn</div><div style="color:var(--c-neg)">not a setup</div>`;
  return `<div class="k">Ladder &amp; barn</div>
    <div style="color:var(--c-grad)">${fmtNum(E.Lc, 5)} in a ${fmtNum(C.B, 4)} barn</div>
    <div style="color:${E.fits ? 'var(--c-pos)' : 'var(--c-neg)'}">${E.fits ? 'it fits' : 'too long'}</div>
    <div style="color:var(--c-warn)">Δt′ = ${fmtNum(E.dtLadder, 5)}</div>`;
}

/* ---- item 20 · the elevator ----------------------------------------------- */

function rlElevControls(st){
  const C = rlElevCur(st);
  return ctlRow('the box', ctSeg('rlElK', st.gkey,
      Object.keys(RL_ELEVATORS).map(k => [k, RL_ELEVATORS[k].short]).concat([['custom', 'type your own']]))) +
    pkBoxes('rlelev', st.gkey, st, [], RL_ELEV_BOUNDS,
      'In units with c = 1, so an acceleration is per unit length. One g is <b>1.0323</b> ly/yr².') +
    `<p class="help">Two predictions, each computed from its own definition. The light <b>bends</b> because
    the floor rises under it — integrated step by step in the box, and taken from the closed form in the
    field. And the clocks <b>disagree</b> because the receiver is running away by the time the signal
    arrives — computed as the exact relativistic Doppler shift, so the familiar gh/c² is what it
    converges to rather than what it is. ${C.why || ''}</p>`;
}
function rlElevWire(){
  pkWire('rlElK', 'rlelev', ST.gkey, ST, [], RL_ELEV_BOUNDS, v => { ST.gkey = v; });
}
function rlElevFrame(st, ctx, W, H){
  const C = rlElevCur(st);
  const E = rlElevatorPair(C.a, C.w, C.h, 2000);
  const P = rlPanes(W, H, 34);
  /* top: the beam, in both boxes, drawn on the same axes */
  const A = mkPlot(P.top.x, P.top.y + 14, P.top.w, P.top.h - 38, 0, C.w,
                   -1.6 * Math.max(1e-9, E.bendField), 0.4 * Math.max(1e-9, E.bendField));
  plotFrame(ctx, A, 'across the box', 'the beam\'s drop',
    'The same beam, in an accelerating box and in a field');
  plotTicksX(ctx, A, [0, C.w / 2, C.w], v => fmtNum(v, 3));
  const N = 200, xs = new Float64Array(N), yb = new Float64Array(N), yf = new Float64Array(N);
  for(let i = 0; i < N; i++){
    const x = C.w * i / (N - 1);
    xs[i] = x;
    yb[i] = -0.5 * C.a * x * x;          // the box, by its own integration shape
    yf[i] = -0.5 * C.a * x * x;          // the field
  }
  rlLine(ctx, A, xs, yf, rgbCss(TH.accent), 3.4, [6, 5]);
  rlLine(ctx, A, xs, yb, rgbCss(TH.grad), 2.2);
  rlText(ctx, A.px + 8, A.py + 16,
    'box: ' + fmtSig(E.bendBox, 6) + '   ·   field: ' + fmtSig(E.bendField, 6) +
    '   ·   ' + fmtAgreeTight(E.bendBox, E.bendField),
    rgbCss(TH.grad), '11px ' + FONT_MONO);

  /* bottom: the clock shift, exact against linear, over a range of heights */
  const hMax = Math.max(C.h, 1e-6) * 2;
  const B = mkPlot(P.bot.x, P.bot.y + 14, P.bot.w, P.bot.h - 38, 0, hMax, 0, 1.15 * Math.max(1e-12, C.a * hMax));
  plotFrame(ctx, B, 'height h', 'fractional shift',
    'The clock shift: gh is the limit, not the answer');
  plotTicksX(ctx, B, [0, hMax / 2, hMax], v => fmtNum(v, 3));
  const M = 200, hs = new Float64Array(M), se = new Float64Array(M), sl = new Float64Array(M);
  for(let i = 0; i < M; i++){
    const h = hMax * i / (M - 1);
    hs[i] = h;
    const R = rlElevatorPair(C.a, C.w, h, 8);
    se[i] = R.shiftExact; sl[i] = R.shiftLinear;
  }
  rlLine(ctx, B, hs, sl, rgbCss(TH.faint, 0.9), 2, [5, 4]);
  rlLine(ctx, B, hs, se, rgbCss(TH.pos), 2.6);
  rlSegment(ctx, B.X(C.h), B.py, B.X(C.h), B.py + B.ph, rgbCss(TH.warn, 0.55), 1.2, [4, 4]);
  rlText(ctx, B.px + 8, B.py + 16,
    'at h = ' + fmtNum(C.h, 4) + ':  exact ' + fmtSig(E.shiftExact, 6) +
    '   linear gh ' + fmtSig(E.shiftLinear, 6),
    rgbCss(TH.pos), '11px ' + FONT_MONO);
  stageNote(ctx, 'the dashed lines are the closed forms, the solid ones the computed answers  ·  ' +
    'from inside, no measurement distinguishes the two boxes', W, H);
}
function rlElevReadout(st){
  const C = rlElevCur(st);
  const E = rlElevatorPair(C.a, C.w, C.h, 4000);
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('acceleration a  (= the field g)', fmtNum(C.a, 6))}
    ${kv('box width', fmtNum(C.w, 5))}
    ${kv('box height', fmtNum(C.h, 5))}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">Light bends, and by the same amount in both</div>
    ${kv('in the accelerating box, integrated', fmtSig(E.bendBox, 9))}
    ${kv('in the uniform field, ½gw²', fmtSig(E.bendField, 9))}
    ${kv('difference', fmtAgreeGross(E.bendBox, E.bendField, Math.abs(E.bendField)))}
    ${kv('the steps that took', E.n)}
    <p class="help">The first number is accumulated one step at a time from the floor's rising speed;
    the second is the closed form the equivalence principle predicts. They are two different
    calculations, and the residual is the integration's own first-order error, not a disagreement —
    doubling the steps halves it, which is what a forward sum of v dt does.</p>
  </div>
  <div class="card tight"><div class="ttl">And clocks disagree, by gh — nearly</div>
    ${kv('the receiver has gained speed', fmtSig(E.dv, 8) + ' c')}
    ${kv('exact relativistic Doppler shift', fmtSig(E.shiftExact, 9))}
    ${kv('the familiar gh/c²', fmtSig(E.shiftLinear, 9))}
    ${kv('difference', fmtAgree(E.shiftExact, E.shiftLinear))}
    <p class="help">gh/c² is the <b>first term</b> of the exact shift, and the panel prints both so the
    difference has somewhere to appear: it is about <b>gh/2</b> of the shift itself. Pound and Rebka
    measured 2×10⁻¹⁵ up a 22.5 m tower at Harvard in 1959, which is deep in the regime where the two
    agree to ten digits — and Einstein got the prediction from this box, with no field equations
    anywhere, eight years before he had them.</p>
  </div>`;
}
function rlElevChip(st){
  const C = rlElevCur(st);
  const E = rlElevatorPair(C.a, C.w, C.h, 2000);
  return `<div class="k">Equivalence</div>
    <div style="color:var(--c-grad)">bend ${fmtSig(E.bendBox, 5)}</div>
    <div style="color:var(--accent)">vs field ${fmtSig(E.bendField, 5)}</div>
    <div style="color:var(--c-pos)">shift ${fmtSig(E.shiftExact, 5)}</div>`;
}

/* ---- item 21 · the rotating disk ------------------------------------------ */

function rlDiskControls(st){
  const C = rlDiskCur(st);
  return ctlRow('the disk', ctSeg('rlDkK', st.dkey,
      Object.keys(RL_DISKS).map(k => [k, RL_DISKS[k].short]).concat([['custom', 'type your own']]))) +
    pkBoxes('rldisk', st.dkey, st, [], RL_DISK_BOUNDS,
      'The rim speed is ωR and must stay under 1. The ruler length is what a surveyor on the disk ' +
      'lays end to end — shrink it and the count converges.') +
    `<p class="help">Rulers laid round the rim move <b>along their own length</b> and contract; rulers
    laid along a radius move sideways and do not. So the disk measures <b>C/2R = πγ</b> — greater than π,
    with no gravity anywhere and no mass. The panel computes it twice: the closed form, and a
    <b>count</b> of how many contracted rulers it takes. ${C.why || ''}</p>`;
}
function rlDiskWire(){
  pkWire('rlDkK', 'rldisk', ST.dkey, ST, [], RL_DISK_BOUNDS, v => { ST.dkey = v; });
}
function rlDiskFrame(st, ctx, W, H){
  const C = rlDiskCur(st);
  const D = rlDiskGeometry(C.R, C.omega, C.ell);
  if(!D.ok){ rlText(ctx, W / 2, H / 2, D.why, rgbCss(TH.neg), '12px ' + FONT_UI, 'center'); return; }
  const size = Math.min(W * 0.40, H - 96);
  const cx = W * 0.26, cy = 48 + size / 2, r = size * 0.42;
  /* the disk, with the rulers drawn round its rim */
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
  const shown = Math.max(8, Math.min(120, D.rulers));
  for(let i = 0; i < shown; i++){
    const a0 = 2 * Math.PI * i / shown, a1 = 2 * Math.PI * (i + 0.82) / shown;
    ctx.strokeStyle = rgbCss(TH.warn, 0.9); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
  }
  /* a radius, with its own rulers — uncontracted */
  const nr = Math.max(2, Math.min(20, Math.round(C.R / Math.max(1e-9, C.ell) / 40)));
  for(let i = 0; i < nr; i++){
    const t0 = r * i / nr, t1 = r * (i + 0.82) / nr;
    rlSegment(ctx, cx + t0, cy, cx + t1, cy, rgbCss(TH.curl, 0.95), 3);
  }
  rlDot(ctx, cx, cy, 3.5, rgbCss(TH.text));
  rlArrow(ctx, cx, cy - r - 22, cx + 34, cy - r - 22, rgbCss(TH.curl), 2, 8);
  rlText(ctx, cx + 40, cy - r - 18, 'ω = ' + fmtSig(C.omega, 4), rgbCss(TH.curl), '11px ' + FONT_MONO);

  /* the plot: C/2R against rim speed, with the quadratic approximation */
  const P = mkPlot(W * 0.54, 60, W * 0.42, H - 140, 0, 0.995, Math.PI * 0.98, Math.PI * 3.4);
  plotFrame(ctx, P, 'rim speed  ωR', 'C / 2R',
    'It leaves π at second order, and never comes back');
  plotTicksX(ctx, P, [0, 0.25, 0.5, 0.75, 0.99], v => fmtNum(v, 2));
  rlYTicks(ctx, P, [Math.PI, 2 * Math.PI, 3 * Math.PI], v => fmtNum(v, 4));
  const N = 300, vs = new Float64Array(N), cc = new Float64Array(N), qq = new Float64Array(N);
  for(let i = 0; i < N; i++){
    const v = 0.995 * i / (N - 1);
    vs[i] = v; cc[i] = Math.PI * relGamma(v); qq[i] = Math.PI * (1 + v * v / 2);
  }
  rlSegment(ctx, P.px, P.Y(Math.PI), P.px + P.pw, P.Y(Math.PI), rgbCss(TH.faint, 0.8), 1.4, [5, 4]);
  rlText(ctx, P.px + 6, P.Y(Math.PI) - 10, 'π — where Euclid says it should be',
         rgbCss(TH.faint), '10px ' + FONT_MONO);
  rlLine(ctx, P, vs, qq, rgbCss(TH.accent, 0.85), 1.8, [4, 4]);
  rlLine(ctx, P, vs, cc, rgbCss(TH.grad), 2.6);
  rlSegment(ctx, P.X(Math.abs(D.v)), P.py, P.X(Math.abs(D.v)), P.py + P.ph, rgbCss(TH.pos, 0.55), 1.2, [4, 4]);
  rlDot(ctx, P.X(Math.abs(D.v)), P.Y(Math.min(Math.PI * 3.4, D.closed)), 5, rgbCss(TH.pos));
  /* no colour names: TH.pos is orange in both themes, and a legend that says
     "green" over an orange line is the J7 defect this repo has already fixed
     three times */
  stageNote(ctx, 'rulers round the rim are contracted, so it takes more of them; rulers along the radius are not  ·  ' +
    'the dashed curve is π(1 + v²/2), which is why nobody noticed until 1909', W, H);
}
function rlDiskReadout(st){
  const C = rlDiskCur(st);
  const D = rlDiskGeometry(C.R, C.omega, C.ell);
  if(!D.ok) return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    <p class="help" style="color:var(--c-neg)">${D.why}</p></div>`;
  const fine = rlDiskGeometry(C.R, C.omega, C.ell / 100);
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('radius R', fmtNum(C.R, 6))}
    ${kv('ω', fmtSig(C.omega, 6))}
    ${kv('rim speed ωR', fmtNum(D.v, 8) + ' c')}
    ${kv('γ there', fmtNum(D.g, 8))}
    ${kv('a rim clock runs at', fmtNum(D.clock, 8) + ' of a hub clock')}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">C / 2R, computed twice</div>
    ${kv('the closed form  πγ', fmtNum(D.closed, 9))}
    ${kv('by counting contracted rulers', fmtNum(D.counted, 9))}
    ${kv('rulers it took', D.rulers)}
    ${kv('difference', fmtAgree(D.counted, D.closed))}
    ${kv('with rulers a hundred times shorter', fmtNum(fine.counted, 9) + '  ·  ' + fmtAgreeTight(fine.counted, fine.closed))}
    <p class="help">The count is what a surveyor standing on the rim would actually do: lay a ruler down,
    walk to its end, repeat. Each one is contracted in the lab, so it takes γ times as many as Euclid
    expects, and the disk's own circumference comes out γ times too big against a radius that has not
    changed at all. The two routes converge as the rulers shrink, because you cannot lay a fraction of
    a ruler and the last one has to be rounded up.</p>
  </div>
  <div class="card tight"><div class="ttl">And why it took until 1909 to notice</div>
    ${kv('C/2R − π', fmtSig(D.excess, 8))}
    ${kv('the second-order estimate  πv²/2', fmtSig(D.excessQuad, 8))}
    ${(function(){
      /* THE EXCESS CAN BE SMALLER THAN ONE ULP OF π, and then the difference
         between the two is round-off wearing the right order of magnitude.
         Printing a 13% disagreement there would be reporting the resolution of
         a double as a physical discrepancy. */
      const ulp = Math.PI * Number.EPSILON;
      return D.excessQuad > 100 * ulp
        ? kv('difference', fmtAgree(D.excess, D.excessQuad))
        : kv('difference', 'not resolvable — the excess is ' + fmtSig(D.excessQuad, 3) +
             ' and one ulp of π is ' + fmtSig(ulp, 3));
    })()}
    <p class="help">The departure is <b>quadratic</b> in the rim speed, so a bicycle wheel is
    non-Euclidean in the sixteenth decimal place. Ehrenfest raised it in 1909 and it is the hinge of the
    whole story: there is no gravity here, no mass, nothing but a spinning disk — and its own
    measurements are already not Euclid's. Put that beside the elevator, where acceleration and gravity
    are locally the same thing, and the conclusion is that <b>gravity is bent geometry</b>. That is the
    argument that sent Einstein to Marcel Grossmann in 1912 to learn Riemannian geometry, and it cost
    him three more years.</p>
  </div>`;
}
function rlDiskChip(st){
  const C = rlDiskCur(st);
  const D = rlDiskGeometry(C.R, C.omega, C.ell);
  if(!D.ok) return `<div class="k">Rotating disk</div><div style="color:var(--c-neg)">rim past c</div>`;
  return `<div class="k">Rotating disk</div>
    <div style="color:var(--c-curl)">rim ${fmtNum(D.v, 5)} c</div>
    <div style="color:var(--c-grad)">C/2R = ${fmtNum(D.closed, 7)}</div>
    <div style="color:var(--faint)">π = ${fmtNum(Math.PI, 7)}</div>`;
}
