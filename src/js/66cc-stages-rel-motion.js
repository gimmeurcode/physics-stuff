/* ============================================================================
   GROUP 2c · A MOTION PROGRAMME THE READER WRITES
   The panel half of Programme A relativity items 12 (`rlTwin`) and 13
   (`rlRocket`); the arithmetic is in 46h-sr-motion.js. Both stages gain a mode
   rather than losing one — the existing ones are the two special cases the
   textbook draws, and this is the general instrument they are cases of.

   The two stages share every panel here and differ only in the picture: the
   twin wants both worldlines on one Minkowski diagram, and the rocket wants the
   ship's own quantities against its own clock. Control ids take a prefix,
   because there is one document and `auditlink` fails on a duplicate.
   ============================================================================ */

function rlMotMeasured(st, pre){
  const C = rlMotCur(st, pre);
  const key = C.src + '|' + C.tau1;
  const slot = '_mot_' + pre;
  if(st[slot] && st[slot].key === key) return st[slot];
  const pf = pkParamFn(C.src);
  const M = rlMotionMeasure(t => pf(t, 1), C.tau1, 2400);
  M.key = key; M.C = C; M.f = t => pf(t, 1);
  st[slot] = M;
  return M;
}

function rlMotControls(st, pre){
  const C = rlMotCur(st, pre);
  return ctlRow('the programme', pkSeg(pre + 'K', RL_MOTIONS, st[pre + 'key'], e => e.short || e.name)) +
    pkBoxes(pre, st[pre + 'key'], st, RL_MOT_SLOTS, RL_MOT_BOUNDS,
      'Written in <b>t</b>, which here means <b>τ — your own clock</b>, in years. The acceleration is ' +
      'in light-years per year², and one g is <b>1.0323</b> of those. Try <b>1.0323</b> (hold one g), ' +
      '<b>1.0323*cos(t/2)</b> (a slow oscillation), <b>0.3*t</b> (a rising thrust), or ' +
      '<b>2/(1+t^2)</b> (a burn that fades).') +
    `<p class="help">Proper acceleration is the derivative of <b>rapidity</b>: dφ/dτ = a(τ) exactly.
    So what an engine delivers, steadily, is rapidity — the final speed is <b>tanh</b> of the area under
    your curve, and no area reaches c. That is why "keep accelerating at one g" is a coherent
    instruction forever and "keep gaining 10 m/s every second" is not. ${C.why || ''}</p>`;
}
function rlMotWire(pre){
  pkWire(pre + 'K', pre, ST[pre + 'key'], ST, RL_MOT_SLOTS, RL_MOT_BOUNDS,
         v => { ST[pre + 'key'] = v; ST['_mot_' + pre] = null; },
         () => { ST['_mot_' + pre] = null; });
}

/* the twin's picture: both worldlines on one diagram, and the ledger */
function rlMotFrameTwin(st, ctx, W, H, pre){
  const M = rlMotMeasured(st, pre), C = M.C;
  const gap = 26, top = 52, bot = 44;
  const pw = (W - 3 * gap) / 2, ph = Math.max(80, H - top - bot);
  if(!M.ok){
    rlText(ctx, W / 2, H / 2, M.why, rgbCss(TH.neg), '12px ' + FONT_UI, 'center');
    return;
  }
  const R = M.run;
  let xLo = 0, xHi = 0;
  for(let i = 0; i <= R.n; i++){ xLo = Math.min(xLo, R.xs[i]); xHi = Math.max(xHi, R.xs[i]); }
  const P = rlWlPane(gap, top, pw, ph, xLo, xHi, 0, R.tEnd);
  /* the light cone from the parting event, and the two worldlines */
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.strokeRect(P.px, P.py, P.pw, P.ph);
  ctx.save(); ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
  const L = 4 * (P.pw + P.ph) / P.sc;
  for(const s of [1, -1])
    rlSegment(ctx, P.X(0), P.Y(0), P.X(s * L), P.Y(L), rgbCss(TH.warn, 0.7), 1.5);
  /* the stay-at-home: straight up */
  rlSegment(ctx, P.X(0), P.Y(0), P.X(0), P.Y(R.tEnd), rgbCss(TH.accent, 0.95), 2.2);
  /* the traveller */
  ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.6; ctx.beginPath();
  const dec = Math.max(1, Math.round(R.n / 300));
  for(let i = 0; i <= R.n; i += dec){
    const X = P.X(R.xs[i]), Y = P.Y(R.ts[i]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.stroke();
  /* A tick on each worldline per year of ITS OWN time — the whole point, drawn.
     The two clocks need SEPARATE steps, and the steps have to be chosen rather
     than assumed to be one year: the stay-at-home's clock reads sinh(φ)/a, so a
     programme the reader is entitled to type takes it to 10²⁰ years and one dot
     per year is 10²⁰ dots. ctUnitMarks bounds the count instead of the range. */
  const travMk = ctUnitMarks(0, C.tau1, 36), homeMk = ctUnitMarks(0, R.tEnd, 36);
  for(const k of travMk.vals){
    const i = Math.max(0, Math.min(R.n, Math.round(R.n * k / C.tau1)));
    rlDot(ctx, P.X(R.xs[i]), P.Y(R.ts[i]), 3, rgbCss(TH.grad, 0.9));
  }
  for(const k of homeMk.vals)
    rlDot(ctx, P.X(0), P.Y(k), 3, rgbCss(TH.accent, 0.9));
  ctx.restore();
  rlText(ctx, P.px + 6, P.py + 14, 'ct', rgbCss(TH.dim), '600 12px ' + FONT_MONO);
  rlText(ctx, P.px + P.pw - 6, P.py + P.ph - 8, 'x', rgbCss(TH.dim), '600 12px ' + FONT_MONO, 'right');

  /* the ledger, on the right */
  const bx = 2 * gap + pw, bw = pw;
  let by = top + 10;
  const line = (lbl, val, col) => {
    rlText(ctx, bx, by, lbl, rgbCss(TH.dim), '11.5px ' + FONT_UI);
    rlText(ctx, bx + bw, by, val, rgbCss(col), '11.5px ' + FONT_MONO, 'right');
    by += 21;
  };
  ctx.font = '600 12.5px ' + FONT_UI;
  rlText(ctx, ctTitleClearChip(ctx, bx + bw / 2, top - 16, C.name), top - 16, C.name,
         rgbCss(TH.text), '600 12.5px ' + FONT_UI, 'center');
  line('the traveller ages', fmtNum(M.tau, 6) + ' yr', TH.grad);
  line('the stay-at-home ages', fmtNum(M.t, 6) + ' yr', TH.accent);
  line('the ratio', fmtNum(M.dilation, 6), TH.curl);
  line('and the difference', fmtSig(M.t - M.tau, 6) + ' yr', TH.faint);
  by += 8;
  line('furthest from home', fmtNum(Math.max.apply(null, Array.from(R.xs)), 5) + ' ly', TH.pos);
  line('back where they started?', M.returns ? 'yes' : 'no — ' + fmtSig(M.x, 4) + ' ly out', TH.pos);
  line('fastest they went', fmtNum(M.betaMax, 8) + ' c', TH.warn);
  line('largest γ', fmtSig(M.gammaMax, 6), TH.warn);
  by += 8;
  line('proper time, read back off the curve', fmtNum(M.chords, 8) + ' yr', TH.faint);
  line('against the τ it was integrated in', fmtAgreeTight(M.chords, M.tau), TH.faint);
  const dotSay = (travMk.step === 1 && homeMk.step === 1)
    ? 'dots are one year of each twin\'s OWN clock — count them'
    : 'dots: every ' + fmtSig(travMk.step, 3) + ' yr of the traveller\'s clock, every ' +
      fmtSig(homeMk.step, 3) + ' yr of the stay-at-home\'s';
  stageNote(ctx, dotSay + '  ·  ' +
    'the straight route between the same two events is the longest one there is', W, H);
}

/* the rocket's picture: the ship's own quantities against its own clock */
function rlMotFrameShip(st, ctx, W, H, pre){
  const M = rlMotMeasured(st, pre), C = M.C;
  if(!M.ok){
    rlText(ctx, W / 2, H / 2, M.why, rgbCss(TH.neg), '12px ' + FONT_UI, 'center');
    return;
  }
  const R = M.run;
  const Pn = rlPanes(W, H, 34);
  const N = Math.min(R.n, 400), dec = Math.max(1, Math.round(R.n / N));
  const m = Math.floor(R.n / dec) + 1;
  const ta = new Float64Array(m), ac = new Float64Array(m), ph = new Float64Array(m),
        be = new Float64Array(m), tt = new Float64Array(m);
  let aHi = 1e-12, pHi = 1e-12, tHi = 1e-12;
  for(let j = 0; j < m; j++){
    const i = Math.min(R.n, j * dec);
    ta[j] = R.tau[i]; ac[j] = M.f(R.tau[i]); ph[j] = R.ph[i];
    be[j] = Math.tanh(R.ph[i]); tt[j] = R.ts[i];
    aHi = Math.max(aHi, Math.abs(ac[j])); pHi = Math.max(pHi, Math.abs(ph[j]));
    tHi = Math.max(tHi, tt[j]);
  }
  /* top: the engine and the rapidity it delivers — the same curve twice, once
     as a rate and once as its integral, which is the whole lesson */
  const A = mkPlot(Pn.top.x, Pn.top.y + 14, Pn.top.w, Pn.top.h - 38, 0, C.tau1,
                   -1.1 * Math.max(aHi, pHi), 1.1 * Math.max(aHi, pHi));
  plotFrame(ctx, A, 'τ — the ship\'s own clock (yr)', '',
    'What the engine delivers is rapidity: φ is the area under a');
  plotZeroY(ctx, A);
  const aStep = rlTickStep(C.tau1, 6);
  const aTicks = []; for(let v = 0; v <= C.tau1 + 1e-9; v += aStep) aTicks.push(v);
  plotTicksX(ctx, A, aTicks, v => fmtTick(v, aStep));
  rlLine(ctx, A, ta, ac, rgbCss(TH.warn), 2.2);
  rlLine(ctx, A, ta, ph, rgbCss(TH.curl), 2.6);
  /* upper LEFT, not right: both curves start at zero and rise, so the left of
     each pane is the empty corner. Put this on the right and it prints through
     the plateau φ settles onto — which is exactly what it did. */
  rlText(ctx, A.px + 8, A.py + 15,
         'a(τ) in ly/yr²   ·   φ = ∫a dτ = ' + fmtNum(M.phi, 5),
         rgbCss(TH.curl), '11px ' + FONT_MONO);

  /* bottom: the speed it buys, and the home clock running away */
  const B = mkPlot(Pn.bot.x, Pn.bot.y + 14, Pn.bot.w, Pn.bot.h - 38, 0, C.tau1, 0, 1.08);
  plotFrame(ctx, B, 'τ (yr)', 'β,  and t rescaled',
    'The speed it buys — and the home clock, divided by its own end value');
  plotTicksX(ctx, B, aTicks, v => fmtTick(v, aStep));
  rlYTicks(ctx, B, [0, 0.25, 0.5, 0.75, 1]);
  rlSegment(ctx, B.px, B.Y(1), B.px + B.pw, B.Y(1), rgbCss(TH.warn, 0.8), 1.4, [5, 4]);
  rlText(ctx, B.px + 6, B.Y(1) - 10, 'c — approached, never reached',
         rgbCss(TH.warn), '10px ' + FONT_MONO);
  const tn = new Float64Array(m);
  for(let j = 0; j < m; j++) tn[j] = tt[j] / Math.max(1e-30, tHi);
  rlLine(ctx, B, ta, tn, rgbCss(TH.accent), 2.2, [5, 4]);
  rlLine(ctx, B, ta, be, rgbCss(TH.grad), 2.6);
  rlText(ctx, B.px + 8, B.py + 34,
         'β_end = ' + fmtNum(M.beta, 8) + '   γ_end = ' + fmtSig(M.gamma, 5),
         rgbCss(TH.grad), '11px ' + FONT_MONO);
  stageNote(ctx, 'the ship ages ' + fmtNum(M.tau, 5) + ' yr while home ages ' + fmtNum(M.t, 6) +
    '  ·  the Rindler horizon sits ' + fmtSig(M.horizon, 4) + ' ly astern while the engine is on', W, H);
}

/* the readout both stages share */
function rlMotReadout(st, pre){
  const M = rlMotMeasured(st, pre), C = M.C;
  const head = `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('a(τ)', supify(C.ex || pkPretty(C.src)))}
    ${kv('run for', fmtNum(C.tau1, 5) + ' yr of the ship\'s own time')}`;
  if(!M.ok) return head + `<p class="help" style="color:var(--c-neg)">${M.why}</p></div>`;
  return head + `<p class="help">${C.why || ''}</p></div>
    <div class="card tight"><div class="ttl">Two clocks, and the gap between them</div>
      ${kv('the ship ages', fmtNum(M.tau, 8) + ' yr')}
      ${kv('home ages', fmtNum(M.t, 8) + ' yr')}
      ${kv('ratio  t/τ', fmtNum(M.dilation, 8))}
      ${kv('where it ended up', fmtNear(M.x) + ' ly' + (M.returns ? '  — back where it started' : ''))}
      ${kv('final rapidity  φ = ∫a dτ', fmtNum(M.phi, 8))}
      ${kv('final speed  tanh φ', fmtNum(M.beta, 10) + ' c')}
      ${kv('final γ = cosh φ', fmtSig(M.gamma, 8))}
      ${kv('fastest reached', fmtNum(M.betaMax, 10) + ' c  (γ = ' + fmtSig(M.gammaMax, 6) + ')')}
      <p class="help">The integration is done in <b>rapidity</b>, where nothing is singular: dφ/dτ = a,
      then β = tanh φ and γ = cosh φ. No expression here divides by 1 − β², which is why a programme
      that reaches ${fmtNum(M.betaMax, 9)}c costs exactly as much arithmetic as one that dawdles.</p>
    </div>
    <div class="card tight"><div class="ttl">The proper time, read back off the worldline</div>
      ${kv('τ, the variable it was integrated in', fmtNum(M.tau, 10))}
      ${kv('Σ√(Δt² − Δx²) along the curve it drew', fmtNum(M.chords, 10))}
      ${kv('difference', fmtAgree(M.chords, M.tau))}
      ${kv('and it is high, not low', M.chords >= M.tau ? 'yes — as it must be' : 'NO — that is a defect')}
      ${kv('the Rindler horizon, while the engine is on', fmtSig(M.horizon, 6) + ' ly astern')}
      <p class="help">The second number knows nothing about a, φ or a differential equation: it is the
      <b>length of the curve</b> the first one drew, added up chord by chord. It comes out <i>above</i>
      the true proper time and falls onto it as the chords shorten — because a chord is the straight
      route between two events, and in this geometry the straight route is the longest one. That single
      reversed inequality is the twin paradox, and it is the same fact this stage is about.</p>
      <p class="help">The horizon is not decoration. While the acceleration is held, no signal from more
      than ${fmtSig(M.horizon, 4)} light-years astern ever catches up — a horizon built out of nothing
      but motion, in flat spacetime, with no mass anywhere.</p>
    </div>`;
}
function rlMotChip(st, pre){
  const M = rlMotMeasured(st, pre);
  if(!M.ok) return `<div class="k">Programme</div><div style="color:var(--c-neg)">refused</div>`;
  return `<div class="k">Programme</div>
    <div style="color:var(--c-grad)">ship ${fmtNum(M.tau, 4)} yr</div>
    <div style="color:var(--accent)">home ${fmtNum(M.t, 6)} yr</div>
    <div style="color:var(--c-curl)">φ = ${fmtNear(M.phi)}</div>`;
}
function rlMotLegendTwin(){
  return [['var(--c-grad)', 'the traveller, and a dot per year of their clock'],
          ['var(--accent)', 'the stay-at-home, and a dot per year of theirs'],
          ['var(--c-warn)', 'the light cone from the parting'],
          ['var(--c-curl)', 'the ratio of the two ages']];
}
function rlMotLegendShip(){
  return [['var(--c-warn)', 'a(τ) — what the engine delivers'],
          ['var(--c-curl)', 'φ = ∫a dτ — the rapidity it buys'],
          ['var(--c-grad)', 'β = tanh φ — the speed that buys'],
          ['var(--accent)', 'the home clock, rescaled to fit']];
}
