/* ============================================================================
   GROUP 2 · THE GEOMETRY OF SPACETIME
   ============================================================================ */

/* a square spacetime diagram: ct upward, x to the right, light at 45° */
function rlMinkPlot(cx, cy, sc, half){
  return { cx, cy, sc, half,
    X: x => cx + x * sc, Y: t => cy - t * sc,
    ix: sx => (sx - cx) / sc, it: sy => (cy - sy) / sc };
}
const rlMinkLine = (ctx, M, x0, t0, x1, t1, col, w, dash) =>
  rlSegment(ctx, M.X(x0), M.Y(t0), M.X(x1), M.Y(t1), col, w, dash);

/* ---- 7 · the spacetime diagram ---------------------------------------------
   Minkowski's contribution, and the one that made general relativity possible:
   stop treating time as a parameter and draw it as an axis. A boost is then not
   a mysterious rescaling but a rotation — a hyperbolic one, which scissors the
   axes together instead of turning them rigidly. */
STAGES.rlMink = {
  title: 'Minkowski diagram',
  derive(st){
    if(st.mode === 'world') return rlMinkWlDerive(st);
    const n = v => fmtNum(v, 6);
    return {
      title:'Spacetime has a geometry, and it is not Euclidean',
      steps:[
        drvSay('the change of viewpoint that made relativity simple',
          'Minkowski proposed treating time as a fourth coordinate and asking what geometry the postulates imply. The answer is a geometry with one sign flipped — and every result of special relativity becomes a statement about distances in it.'),
        drvStep('the invariant interval',
          `${dv('s')}² ${dop('=')} ${dv('c')}²${dv('t')}² ${dop('−')} ${dv('x')}²`,
          `at the marked event (${n(st.ex)}, ${n(st.et)}) the panel prints s² and confirms it is frame-independent`),
        drvSay('one minus sign is the entire content',
          'Euclidean distance adds squares; this subtracts. That single change converts rotations into hyperbolic rotations, circles into hyperbolas, and produces every relativistic effect. Special relativity is Euclidean geometry with one sign changed.'),
        drvStep('a boost is a hyperbolic rotation',
          `${dv('ct')}′ ${dop('=')} γ(${dv('ct')} ${dop('−')} β${dv('x')}), &nbsp; ${dv('x')}′ ${dop('=')} γ(${dv('x')} ${dop('−')} β${dv('ct')})`,
          `β = ${n(st.beta)} — the panel draws the rotated axes over the original grid`),
        drvSay('and the axes close like scissors rather than turning together',
          'In a Euclidean rotation both axes turn the same way and stay perpendicular. Here they rotate towards the light line from opposite sides. That scissor motion is why the light line is at 45° for everyone — it is the fixed line of the transformation.'),
        drvStep('the hyperbolae are the circles of this geometry',
          `${dv('c')}²${dv('t')}² ${dop('−')} ${dv('x')}² ${dop('=')} const`,
          'every point on one is the same interval from the origin — the panel draws them as calibration curves'),
        drvSay('and they are how the diagram is calibrated',
          'Reading a Minkowski diagram with a ruler gives wrong answers, because the geometry is not the paper\'s. The hyperbolae show where one second and one metre lie on the tilted axes — and that is why the rotated axes look stretched.'),
        drvStep('events fall into three invariant classes',
          `${dv('s')}² ${dop('>')} 0 timelike, ${dop('=')} 0 lightlike, ${dop('<')} 0 spacelike`,
          `here s² = ${n(st.et * st.et - st.ex * st.ex)}: ${st.et * st.et - st.ex * st.ex > 0 ? 'timelike — causally connectable' : st.et * st.et - st.ex * st.ex < 0 ? 'spacelike — no causal connection' : 'lightlike'}`),
        drvSay('and that classification is what protects causality',
          'Timelike separation means one event can influence the other, and every frame agrees on their order. Spacelike separation means no signal can connect them, and different frames order them differently — harmlessly, since neither can affect the other.')
      ],
      note:'The interval is computed in both frames from the transformed coordinates and printed with the difference, which is zero to machine precision. That invariance is the geometric statement all the paradox stages rely on.'
    };
  },
  dockLegend: true,
  drag: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.5 : o.beta;
    st.ex = o.ex === undefined ? 1.4 : o.ex;
    st.et = o.et === undefined ? 2.0 : o.et;
    st.grid = o.grid !== false;
    st.hyper = o.hyper !== false;
    st.mode = o.mode === 'world' ? 'world' : 'event';
    st.wkey = o.wkey || 'shuttle';
    st._wl = null;
  },
  controls(){
    const st = ST;
    const head = ctlRow('what gets boosted',
      ctSeg('rlMkM', st.mode, [['event', 'one event'], ['world', 'a whole worldline']]));
    if(st.mode === 'world') return head + rlMinkWlControls(st);
    return head +
      ctlRow('boost β', ctlSlider('rlMkB', -0.95, 0.95, 0.005, st.beta)) +
      `<label class="chk"><input type="checkbox" id="rlMkG" ${st.grid?'checked':''}><span>the moving frame's own coordinate grid</span></label>
       <label class="chk"><input type="checkbox" id="rlMkH" ${st.hyper?'checked':''}><span>the calibration hyperbolae</span></label>
       <p class="help"><b>Click or drag in the diagram to move the event.</b> Teal axes are the lab frame,
       orange ones belong to an observer moving at β. They scissor <i>towards</i> the light cone rather
       than rotating rigidly — that is what a hyperbolic rotation looks like, and it is why the light
       cone is the one thing both frames agree on. The purple hyperbolae <b>(ct)² − x² = ±1</b> mark
       where each frame's unit tick and unit ruler land; the primed unit sits further out along its own
       axis, which is time dilation and length contraction drawn as geometry instead of asserted as
       formulas.</p>`;
  },
  wire(){
    ctWireSeg('rlMkM', v => { ST.mode = v; ST._wl = null; });
    if(ST.mode === 'world'){ rlMinkWlWire(); return; }
    wireSlider('rlMkB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
    $('rlMkG').addEventListener('change', e => { ST.grid = e.target.checked; });
    $('rlMkH').addEventListener('change', e => { ST.hyper = e.target.checked; });
  },
  pick(st, sx, sy){
    if(!st.M || st.mode === 'world') return;
    st.ex = Math.max(-st.M.half, Math.min(st.M.half, st.M.ix(sx)));
    st.et = Math.max(-st.M.half, Math.min(st.M.half, st.M.it(sy)));
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'world') return rlMinkWlFrame(st, ctx, W, H);
    const half = 3;
    const size = Math.min(W * 0.52, H - 100);
    const cx = W * 0.33, cy = 46 + size / 2, sc = size / (2 * half);
    const M = rlMinkPlot(cx, cy, sc, half);
    st.M = M;
    const b = st.beta, g = relGamma(b), ig = Math.sqrt(1 - b * b);

    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    ctx.save(); ctx.beginPath();
    ctx.rect(cx - size / 2, cy - size / 2, size, size); ctx.clip();

    /* the moving frame's own grid, faintly, underneath everything */
    if(st.grid) for(let n = -8; n <= 8; n++){
      if(!n) continue;
      rlMinkLine(ctx, M, -9, b * -9 + n * ig, 9, b * 9 + n * ig, rgbCss(TH.pos, 0.14), 1);
      rlMinkLine(ctx, M, b * -9 + n * ig, -9, b * 9 + n * ig, 9, rgbCss(TH.pos, 0.14), 1);
    }
    for(let n = -half; n <= half; n++){
      if(!n) continue;
      rlMinkLine(ctx, M, -half, n, half, n, rgbCss(TH.line, 0.7), 0.8);
      rlMinkLine(ctx, M, n, -half, n, half, rgbCss(TH.line, 0.7), 0.8);
    }
    /* the light cone — the invariant structure of the diagram */
    ctx.fillStyle = rgbCss(TH.warn, 0.05);
    for(const s of [1, -1]){
      ctx.beginPath();
      ctx.moveTo(M.X(0), M.Y(0));
      ctx.lineTo(M.X(-half), M.Y(s * half)); ctx.lineTo(M.X(half), M.Y(s * half));
      ctx.closePath(); ctx.fill();
    }
    rlMinkLine(ctx, M, -half, -half, half, half, rgbCss(TH.warn, 0.9), 1.8);
    rlMinkLine(ctx, M, -half, half, half, -half, rgbCss(TH.warn, 0.9), 1.8);

    /* the calibration hyperbolae, and where each frame's unit lands on them */
    if(st.hyper){
      ctx.strokeStyle = rgbCss(TH.curl, 0.7); ctx.lineWidth = 1.4;
      for(const timelike of [true, false]) for(const sgn of [1, -1]){
        ctx.beginPath();
        let on = false;
        for(let i = 0; i <= 240; i++){
          const u = -3 + 6 * i / 240;
          const x = timelike ? Math.sinh(u) : sgn * Math.cosh(u);
          const t = timelike ? sgn * Math.cosh(u) : Math.sinh(u);
          if(Math.abs(x) > half + 0.4 || Math.abs(t) > half + 0.4){ on = false; continue; }
          on ? ctx.lineTo(M.X(x), M.Y(t)) : (ctx.moveTo(M.X(x), M.Y(t)), on = true);
        }
        ctx.stroke();
      }
      rlDot(ctx, M.X(0), M.Y(1), 3.6, rgbCss(TH.grad));
      rlDot(ctx, M.X(1), M.Y(0), 3.6, rgbCss(TH.grad));
      rlDot(ctx, M.X(g * b), M.Y(g), 3.6, rgbCss(TH.pos));
      rlDot(ctx, M.X(g), M.Y(g * b), 3.6, rgbCss(TH.pos));
    }
    /* the axes of both frames */
    rlMinkLine(ctx, M, -half, 0, half, 0, rgbCss(TH.grad), 2);
    rlMinkLine(ctx, M, 0, -half, 0, half, rgbCss(TH.grad), 2);
    rlMinkLine(ctx, M, -b * half, -half, b * half, half, rgbCss(TH.pos), 2);
    rlMinkLine(ctx, M, -half, -b * half, half, b * half, rgbCss(TH.pos), 2);

    /* the event, its projections in both frames, and the hyperbola it is stuck on */
    const s2 = relInterval(st.et, st.ex);
    const E = relBoost(st.et, st.ex, b);
    ctx.strokeStyle = rgbCss(TH.accent, 0.6); ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]); ctx.beginPath();
    { let on = false;
      for(let i = 0; i <= 320; i++){
        const u = -3.2 + 6.4 * i / 320;
        const r = Math.sqrt(Math.abs(s2));
        let x, t;
        if(s2 > 0){ x = r * Math.sinh(u); t = Math.sign(st.et || 1) * r * Math.cosh(u); }
        else if(s2 < 0){ x = Math.sign(st.ex || 1) * r * Math.cosh(u); t = r * Math.sinh(u); }
        else { x = u; t = Math.sign(st.et || 1) * Math.abs(u); }
        if(Math.abs(x) > half + 0.3 || Math.abs(t) > half + 0.3){ on = false; continue; }
        on ? ctx.lineTo(M.X(x), M.Y(t)) : (ctx.moveTo(M.X(x), M.Y(t)), on = true);
      } }
    ctx.stroke(); ctx.setLineDash([]);
    /* lab projections are perpendicular; primed ones run parallel to the other
       primed axis, which is exactly why the two frames read different numbers */
    rlMinkLine(ctx, M, st.ex, st.et, 0, st.et, rgbCss(TH.grad, 0.45), 1, [3, 3]);
    rlMinkLine(ctx, M, st.ex, st.et, st.ex, 0, rgbCss(TH.grad, 0.45), 1, [3, 3]);
    rlMinkLine(ctx, M, st.ex, st.et, E.t * g * b, E.t * g, rgbCss(TH.pos, 0.5), 1, [3, 3]);
    rlMinkLine(ctx, M, st.ex, st.et, E.x * g, E.x * g * b, rgbCss(TH.pos, 0.5), 1, [3, 3]);
    rlDot(ctx, M.X(st.ex), M.Y(st.et), 6, rgbCss(TH.accent), rgbCss(TH.bg));
    ctx.restore();

    rlText(ctx, M.X(half) + 6, M.Y(0), 'x', rgbCss(TH.grad), '600 12px ' + FONT_MONO);
    rlText(ctx, M.X(0), M.Y(half) - 12, 'ct', rgbCss(TH.grad), '600 12px ' + FONT_MONO, 'center');
    rlText(ctx, M.X(b * half) + 9, M.Y(half) + 5, "ct′", rgbCss(TH.pos), '600 12px ' + FONT_MONO);
    rlText(ctx, M.X(half) + 6, M.Y(b * half) + 14, "x′", rgbCss(TH.pos), '600 12px ' + FONT_MONO);

    /* a rapidity dial, so the "rotation" is not just a word */
    const dx = W * 0.76, dy = 130, dr = Math.min(78, W * 0.07);
    const phi = relRapidity(b);
    rlText(ctx, dx, dy - dr - 26, 'a boost is a rotation through a hyperbolic angle',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    ctx.strokeStyle = rgbCss(TH.curl, 0.55); ctx.lineWidth = 1.4;
    ctx.beginPath();
    for(let i = 0; i <= 120; i++){
      const u = -1.9 + 3.8 * i / 120;
      const X = dx + dr * Math.sinh(u) / Math.sinh(1.9), Y = dy - dr * (Math.cosh(u) - 1) / (Math.cosh(1.9) - 1) * 0.8;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    const dX = dx + dr * Math.sinh(phi) / Math.sinh(1.9);
    const dY = dy - dr * (Math.cosh(phi) - 1) / (Math.cosh(1.9) - 1) * 0.8;
    rlArrow(ctx, dx, dy, dX, dY, rgbCss(TH.pos), 2.2, 8);
    rlDot(ctx, dX, dY, 4, rgbCss(TH.pos));
    rlText(ctx, dx, dy + 26, 'φ = artanh β = ' + fmtNum(phi, 5), rgbCss(TH.pos), '11px ' + FONT_MONO, 'center');
    rlText(ctx, dx, dy + 44, 'γ = cosh φ = ' + fmtNum(g, 5), rgbCss(TH.faint), '11px ' + FONT_MONO, 'center');
    rlText(ctx, dx, dy + 62, 'βγ = sinh φ = ' + fmtNum(g * b, 5), rgbCss(TH.faint), '11px ' + FONT_MONO, 'center');
    stageNote(ctx, 'click in the diagram to move the event  ·  the frames disagree about ct and x, and agree about (ct)² − x²', W, H);
  },
  readout(st){
    if(st.mode === 'world') return rlMinkWlReadout(st);
    const b = st.beta, g = relGamma(b);
    const E = relBoost(st.et, st.ex, b);
    const s2 = relInterval(st.et, st.ex), kind = relIntervalKind(s2);
    return `<div class="card tight"><div class="ttl">The event, in two frames</div>
      ${kv('lab   ct', fmtNum(st.et, 5))}
      ${kv('lab    x', fmtNum(st.ex, 5))}
      ${kv("moving  ct′ = γ(ct − βx)", fmtNum(E.t, 5))}
      ${kv("moving   x′ = γ(x − βct)", fmtNum(E.x, 5))}
      ${kv('β', fmtNum(b, 4))}
      ${kv('γ = cosh φ', fmtNum(g, 6))}
      ${kv('rapidity φ = artanh β', fmtNum(relRapidity(b), 6))}
    </div>
    <div class="card tight"><div class="ttl">What survives the boost</div>
      ${kv('s² = (ct)² − x²   (lab)', fmtNum(s2, 6))}
      ${kv('s²   (moving frame)', fmtNum(relInterval(E.t, E.x), 6))}
      ${kv('difference', fmtAgree(relInterval(E.t, E.x), s2))}
      ${kv('separation', kind)}
      ${kv(kind === 'spacelike' ? 'proper distance' : 'proper time',
           kind === 'timelike' ? fmtNum(Math.sqrt(s2), 5)
         : kind === 'spacelike' ? fmtNum(Math.sqrt(-s2), 5) : '0')}
      <p class="help">${kind === 'timelike'
        ? 'A <b>timelike</b> event is reachable from the origin by something slower than light, so some frame has it happening in the same place — and its interval is the wristwatch time of the observer who goes there. No boost changes that number.'
        : kind === 'spacelike'
        ? 'A <b>spacelike</b> event cannot be reached from the origin by any signal. There is a frame in which it is simultaneous with the origin, one in which it is earlier and one in which it is later — and causality survives precisely because nothing that could be influenced is ever reordered.'
        : 'A <b>lightlike</b> separation: only light connects these two events, and the interval is exactly zero in every frame. That is why the cone is the one feature of the diagram a boost cannot move.'}</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'world') return rlMinkWlChip(st);
    const s2 = relInterval(st.et, st.ex);
    return `<div class="k">Minkowski</div>
      <div style="color:var(--c-pos)">β = ${fmtNum(st.beta, 3)}</div>
      <div style="color:var(--accent)">s² = ${fmtNum(s2, 4)}</div>
      <div style="color:var(--c-warn)">${relIntervalKind(s2)}</div>`;
  },
  legend(st){
    if(st && st.mode === 'world')
      return [['var(--c-grad)', 'the worldline, as the lab draws it'],
              ['var(--c-pos)', 'the same worldline, as the moving observer draws it'],
              ['var(--c-warn)', 'the light cone — 45° in both pictures, and that is the point'],
              ['var(--accent)', 'the straight route between the same two events — the longest one'],
              ['var(--faint)', 'the inscribed polygon, which overshoots']];
    return [['var(--c-grad)', 'lab axes  (ct, x)'], ['var(--c-pos)', "moving axes  (ct′, x′)"],
            ['var(--c-warn)', 'the light cone — identical in every frame'],
            ['var(--c-curl)', '(ct)² − x² = ±1, the calibration hyperbolae'],
            ['var(--accent)', 'your event, and the hyperbola it can never leave']]; }
};

/* ---- the chain of boosts the reader writes (Programme A item 11) -----------
   The arithmetic is `rlChainParse` / `rlChainMeasure` in 46e-sr-frames.js; this
   is the panel half. Cached against the text alone, because a chain of eight
   hundred boosts is composed three times plus a shuffle and the chip asks for
   it several times a second. */
function rlVelChain(st){
  const txt = String(st.chain === undefined ? '' : st.chain);
  if(st._ch && st._ch.txt === txt) return st._ch;
  const P = rlChainParse(txt, []);
  const M = P.steps.length ? rlChainMeasure(P.steps) : null;
  st.cerr = P.errs.length
    ? P.errs.map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('  ·  ')
    : '';
  st._ch = { txt, P, M };
  return st._ch;
}

/* the one-line verdict a derive rung prints */
function rlVelChainVerdict(st){
  const M = rlVelChain(st).M;
  if(!M) return 'no boosts in the chain yet';
  if(M.saturated)
    return 'the velocity route ran out of digits at boost ' + M.satAt +
           ', so the three are compared in rapidity, where they still agree';
  return 'they differ by ' + fmtSig(Math.max(M.gapAB, M.gapBC), 3) +
         ' — round-off, on a β of ' + fmtNum(M.betaB, 9);
}
function rlVelChainSat(st){
  const M = rlVelChain(st).M;
  if(!M) return 'write a chain and the shortfall from c is printed beside it';
  if(M.saturated)
    return 'here 1 − β is ' + fmtSig(M.shortfall, 4) +
           ', which no double can hold — so β prints as exactly 1 and the rapidity is the only variable left';
  return '1 − β = ' + fmtSig(M.shortfall, 5) + ' after ' + M.n + ' boosts, and it never reaches zero';
}

/* the second readout card */
function rlVelChainCard(st){
  const C = rlVelChain(st), M = C.M;
  if(!M)
    return `<div class="card tight"><div class="ttl">Your chain of boosts</div>
      <p class="help" style="color:var(--c-neg)">${st.cerr || 'Nothing to compose — write one β per line.'}</p>
    </div>`;
  const sat = M.saturated;
  return `<div class="card tight"><div class="ttl">Your chain — ${M.n} boost${M.n === 1 ? '' : 's'}, composed three ways</div>
    ${kv('folding the velocity rule', sat ? '1 exactly — no digits left' : fmtNum(M.betaA, 12) + ' c')}
    ${kv('tanh of the summed rapidities', sat ? '1 exactly — no digits left' : fmtNum(M.betaB, 12) + ' c')}
    ${kv('read off the matrix product', sat ? '1 exactly — no digits left' : fmtNum(M.betaC, 12) + ' c')}
    ${sat ? '' : kv('folding vs rapidity', fmtAgreeGross(M.betaA, M.betaB, Math.tanh(M.gross)))}
    ${sat ? '' : kv('rapidity vs matrices', fmtAgreeGross(M.betaB, M.betaC, Math.tanh(M.gross)))}
    ${kv('total rapidity  Σ artanh β', fmtNum(M.phi, 10))}
    ${kv('γ = cosh φ', fmtSig(M.gammaB, 8) + (M.overflowAt ? '  — overflowed a double at boost ' + M.overflowAt : ''))}
    ${kv('1 − |β|, computed from φ', fmtSig(M.shortfall, 6))}
    ${kv('the same chain shuffled', fmtAgreeGross(M.betaA, M.betaShuffled, Math.tanh(M.gross)))}
    ${kv('ΛᵀηΛ − η on the product', fmtGap(M.worstEta, M.etaScale))}
    <p class="help">${sat
      ? 'Past a total rapidity of about 19 there is <b>no double</b> between the composed speed and 1: ' +
        '1 − tanh φ ≈ 2e<sup>−2φ</sup>, and here that is ' + fmtSig(M.shortfall, 4) + '. The velocity ' +
        'route saturated at boost <b>' + M.satAt + '</b> and everything asked in that variable — γ, the ' +
        'shortfall, the residual — lost its answer with it. This is not a numerical accident to be ' +
        'guarded away: it is exactly why accelerator physicists quote rapidity and energy and never a beam speed.'
      : 'Three routes that share no arithmetic: one folds the composition law, one adds hyperbolic angles ' +
        'and takes a single tanh, and one multiplies 2×2 matrices and never meets either formula. ' +
        'The matrix route also certifies that the product is still a boost — ΛᵀηΛ = η, printed against ' +
        'the size of the terms that cancelled, because at large γ those entries are enormous and their ' +
        'difference has few digits in it.'}
    Collinear boosts <b>commute</b>, so shuffling your chain must change nothing — that row is the
    measurement, not a claim. It would fail in 3+1 for boosts along different axes, and the failure is
    the Wigner rotation.</p>
  </div>`;
}
/* ---- 8 · velocity addition and rapidity ------------------------------------
   Why boosts never reach c: velocities do not add, rapidities do, and no finite
   sum of rapidities has a tanh of one. */
STAGES.rlVel = {
  title: 'Adding velocities',
  derive(st){
    const n = v => fmtNum(v, 6);
    const w = (st.u + st.v) / (1 + st.u * st.v);
    return {
      title:'Why 0.75c plus 0.75c is not 1.5c',
      steps:[
        drvStep('the relativistic sum',
          `${dv('w')} ${dop('=')} ${dfrac(dv('u') + ' + ' + dv('v'), '1 + ' + dv('u') + dv('v') + '/' + dv('c') + '²')}`,
          `${n(st.u)}c and ${n(st.v)}c combine to ${n(w)}c, not ${n(st.u + st.v)}c`),
        drvStep('it follows from applying two Lorentz transformations in a row',
          `composing two boosts gives a third boost`,
          'the denominator is what the composition produces — nothing is inserted by hand'),
        drvSay('the classical formula was never exact, only close',
          'Expand the denominator for small speeds and w ≈ u + v − uv²/c². At walking pace the correction is around 10⁻¹⁷ and utterly unmeasurable. Galileo was not wrong so much as working in a limit.'),
        drvStep('and c is a fixed point of the formula',
          `${dfrac('1 + ' + dv('v'), '1 + ' + dv('v'))} ${dop('=')} 1`,
          'put u = c and the answer is c for any v — light cannot be caught up with or outrun'),
        drvSay('so the speed of light is a ceiling built into the arithmetic',
          'It is not that engines are too weak. Adding any two sub-light speeds gives a sub-light speed, always. c is not a barrier to be pushed through — it is an asymptote of the composition law itself.'),
        drvStep('rapidity is the quantity that does add',
          `φ ${dop('=')} artanh(${dv('v')}/${dv('c')}) ${dop('⇒')} φ_total ${dop('=')} φ₁ ${dop('+')} φ₂`,
          `your chain of ${(rlVelChain(st).M || {n:0}).n} boosts totals φ = ${n((rlVelChain(st).M || {phi:0}).phi)}, and the speed creeps towards c while that climbs steadily`),
        drvSay('and that is why rapidity is the natural variable',
          'Boosts are hyperbolic rotations, and rapidity is the hyperbolic angle. Angles add under composition; velocities do not. The awkward velocity formula is just the tanh of a simple sum — artanh is the transformation that makes it linear.'),
        drvStep('the chain is composed three ways that share no arithmetic',
          `fold ${dfrac(dv('w') + ' + β', '1 + ' + dv('w') + 'β')}, &nbsp; add artanh β, &nbsp; multiply Λ(β)`,
          rlVelChainVerdict(st)),
        drvSay('and the third route knows neither formula',
          'It multiplies the 2×2 matrices and reads the boost back off the product. What that measures, beyond the answer, is that the product is STILL a boost — ΛᵀηΛ = η is checked on it rather than assumed. Collinear boosts also commute, so the panel shuffles your chain and composes it again; in 3+1 with boosts along different axes that would fail, and the failure is the Wigner rotation behind Thomas precession.'),
        drvStep('so repeated boosting never gets there',
          `tanh(${dv('n')}φ) ${dop('→')} 1`,
          rlVelChainSat(st)),
        drvSay('and nothing here is a limitation of engines or of fuel',
          'The barrier is arithmetic. tanh of any real number lies strictly between −1 and 1, so no finite sum of rapidities can reach c — a rocket that keeps accelerating gains rapidity at a steady rate forever and simply approaches the light cone asymptotically. The traveller feels a constant push the whole time and never notices a wall. The speed limit is not a force resisting you; it is the shape of the velocity addition law.'),
        drvSay('which is why the light limit is stable, not a coincidence',
          'Put v = c into the addition formula and the result is c, whatever the other speed. Light does not "add up" — it comes out the same in every frame by construction, which is the postulate the whole theory was built to accommodate. Notice this also means the formula never needs a special case at c: the invariance is baked into the algebra rather than imposed on top of it.'),
        drvSay('and it is measured to fifteen figures every day',
          'A GPS satellite\'s clock runs slow by about 7 µs a day from its speed and fast by 45 µs a day from being higher in the Earth\'s gravity, and both corrections are applied. Without them positions would drift by roughly 10 km every day. Particle accelerators are a starker test: an electron at CERN carries a rapidity above 12 while its speed differs from c in the eleventh decimal place — rapidity is the coordinate in which that beam is doing something legible.')
      ],
      note:'The panel composes the boosts one at a time using the full formula rather than the closed form, so the approach to c is a computed sequence. Rapidity is printed alongside, growing linearly while the velocity saturates.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.u = o.u === undefined ? 0.75 : o.u;
    st.v = o.v === undefined ? 0.75 : o.v;
    st.ckey = o.ckey || 'classic';
    st.chain = o.chain !== undefined ? o.chain : RL_CHAINS[st.ckey] ? RL_CHAINS[st.ckey].text : '0.75 x6';
    st.cerr = '';
    st._ch = null;
  },
  controls(){
    const st = ST;
    const C = rlVelChain(st);
    return ctlRow('u  (rocket, in lab)', ctlSlider('rlVeU', -0.99, 0.99, 0.005, st.u)) +
      ctlRow('v  (missile, aboard)', ctlSlider('rlVeV', -0.99, 0.99, 0.005, st.v)) +
      `<p class="help">A rocket moves at <b>u</b>; it fires a missile forward at <b>v</b> as measured
      aboard. Galileo says the lab sees <b>u + v</b> — 1.5c for u = v = 0.75c. What the lab actually sees
      is <b>(u + v)/(1 + uv/c²)</b>, and the upper plot draws that whole curve.</p>` +
      ctlRow('a chain of boosts', ctSeg('rlVeK', st.ckey,
        Object.keys(RL_CHAINS).map(k => [k, RL_CHAINS[k].name]).concat([['custom', 'type your own']]))) +
      `<div class="fld" style="align-items:stretch">
        <textarea id="rlVeS" rows="6" spellcheck="false" autocomplete="off"
          aria-label="a chain of boosts — one β per line, optionally ×N to repeat it"
          data-audit="0.6 x3&#10;-0.2&#10;1/3"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.chain)}</textarea>
      </div>
      <div class="row wrap">${ctBtn('rlVeGo', 'Compose the chain')}</div>
      <p class="help" id="rlVeMsg" style="color:${st.cerr ? 'var(--c-neg)' : 'var(--faint)'}">${st.cerr ||
        (C.M ? C.M.n + ' boost' + (C.M.n === 1 ? '' : 's') + ', total rapidity φ = ' + fmtNum(C.M.phi, 6) +
               ', γ = ' + fmtSig(C.M.gammaB, 6) : 'no boosts')}</p>
      <p class="help">One boost per line: a <b>β</b>, or an expression for one (<b>1/2</b>,
      <b>tanh(1)</b>), optionally followed by <b>×N</b> to repeat it. Lines beginning # are comments.
      Each boost is measured <i>in the frame the previous one left you in</i>. The panel composes them
      three ways that share no arithmetic — folding the velocity addition rule, adding the rapidities,
      and multiplying the 2×2 Lorentz matrices — and prints the differences. ${(RL_CHAINS[st.ckey] || {}).why || ''}</p>`;
  },
  wire(){
    wireSlider('rlVeU', () => ST.u, v => { ST.u = v; }, v => fmtNum(+v, 4) + ' c', RL_BETA_LIM);
    wireSlider('rlVeV', () => ST.v, v => { ST.v = v; }, v => fmtNum(+v, 4) + ' c', RL_BETA_LIM);
    ctWireSeg('rlVeK', k => {
      ST.ckey = k;
      if(RL_CHAINS[k]) ST.chain = RL_CHAINS[k].text;
      ST._ch = null; ST.cerr = '';
    });
    const apply = () => {
      const box = $('rlVeS'); if(!box) return;
      ST.chain = box.value; ST.ckey = 'custom'; ST._ch = null;
      rlVelChain(ST);
      buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
    };
    const b = $('rlVeS'); if(b) b.addEventListener('change', apply);
    const go = $('rlVeGo'); if(go) go.addEventListener('click', apply);
  },
  frame(st, dt, ctx, W, H){
    const P = rlPanes(W, H, 34);
    const N = 400, xs = new Float64Array(N), rel = new Float64Array(N), gal = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const u = -1 + 2 * i / (N - 1);
      xs[i] = u; rel[i] = relVelAdd(u, st.v); gal[i] = u + st.v;
    }
    const A = mkPlot(P.top.x, P.top.y + 14, P.top.w, P.top.h - 38, -1, 1, -1.8, 1.8);
    plotFrame(ctx, A, "u — the rocket's speed in the lab", 'combined speed',
      'Adding v = ' + fmtNum(st.v, 3) + 'c to every u');
    plotZeroY(ctx, A);
    plotTicksX(ctx, A, [-1, -0.5, 0, 0.5, 1], v => fmtNum(v, 2));
    rlYTicks(ctx, A, [-1.5, -1, 0, 1, 1.5]);
    for(const lv of [1, -1])
      rlSegment(ctx, A.px, A.Y(lv), A.px + A.pw, A.Y(lv), rgbCss(TH.warn, 0.8), 1.4, [5, 4]);
    rlText(ctx, A.px + 6, A.Y(1) - 10, 'c — and the relativistic curve never crosses it',
           rgbCss(TH.warn), '10px ' + FONT_MONO);
    rlLine(ctx, A, xs, gal, rgbCss(TH.faint, 0.85), 1.6, [4, 4]);
    rlLine(ctx, A, xs, rel, rgbCss(TH.grad), 2.4);
    const w = relVelAdd(st.u, st.v);
    rlSegment(ctx, A.X(st.u), A.py, A.X(st.u), A.py + A.ph, rgbCss(TH.pos, 0.5), 1.2, [4, 4]);
    rlDot(ctx, A.X(st.u), A.Y(Math.max(-1.8, Math.min(1.8, st.u + st.v))), 4, rgbCss(TH.faint));
    rlDot(ctx, A.X(st.u), A.Y(w), 5.5, rgbCss(TH.pos));
    rlText(ctx, A.X(st.u) + 9, A.Y(w), fmtNum(w, 5) + ' c', rgbCss(TH.pos), '11px ' + FONT_MONO);

    /* the lower pane is the reader's chain, boost by boost: the speed climbing
       towards a ceiling it never reaches, and the rapidity — rescaled to the
       same box — going up as a straight line. One picture, the whole lesson. */
    const C = rlVelChain(st), M = C.M;
    const nb = M ? M.n : 0;
    const B = mkPlot(P.bot.x, P.bot.y + 14, P.bot.w, P.bot.h - 38, 0, Math.max(1, nb), 0, 1.14);
    plotFrame(ctx, B, 'boosts applied, one after another', 'β  (and φ, rescaled)',
      'Your chain: the speed saturates, the rapidity does not');
    /* the step is ROUNDED first and the ticks placed on its multiples, so
       fmtTick is given a step whose decimals mean something (CLAUDE.md) */
    const kStep = Math.max(1, rlTickStep(Math.max(1, nb), 6));
    const kTicks = [];
    for(let v = 0; v <= nb + 1e-9; v += kStep) kTicks.push(v);
    plotTicksX(ctx, B, kTicks, v => fmtTick(v, kStep));
    rlYTicks(ctx, B, [0, 0.25, 0.5, 0.75, 1]);
    rlSegment(ctx, B.px, B.Y(1), B.px + B.pw, B.Y(1), rgbCss(TH.warn, 0.85), 1.4, [5, 4]);
    rlText(ctx, B.px + 6, B.Y(1) - 10, 'c — the chain approaches it and never arrives',
           rgbCss(TH.warn), '10px ' + FONT_MONO);
    if(M && nb > 0){
      const ks = new Float64Array(nb + 1), bs = new Float64Array(nb + 1), ps = new Float64Array(nb + 1);
      const pMax = Math.max(1e-12, Math.abs(M.phiTrack[nb]));
      for(let i = 0; i <= nb; i++){
        ks[i] = i;
        bs[i] = Math.min(1.1, Math.abs(M.track[i]));
        ps[i] = Math.abs(M.phiTrack[i]) / pMax;
      }
      rlLine(ctx, B, ks, ps, rgbCss(TH.curl), 2.2, [5, 4]);
      rlLine(ctx, B, ks, bs, rgbCss(TH.grad), 2.6);
      for(let i = 0; i <= nb; i += Math.max(1, Math.round(nb / 24)))
        rlDot(ctx, B.X(i), B.Y(bs[i]), 2.6, rgbCss(TH.grad, 0.8));
      rlText(ctx, B.px + B.pw - 8, B.py + 15,
        'φ = ' + fmtNum(M.phi, 5) + '   γ = ' + fmtSig(M.gammaB, 5),
        rgbCss(TH.curl), '11px ' + FONT_MONO, 'right');
      if(M.satAt){
        rlSegment(ctx, B.X(M.satAt), B.py, B.X(M.satAt), B.py + B.ph, rgbCss(TH.neg, 0.7), 1.4, [3, 3]);
        rlText(ctx, B.X(M.satAt) + 5, B.py + B.ph - 22,
          'boost ' + M.satAt + ': β reaches 1.0 in float64', rgbCss(TH.neg), '10px ' + FONT_MONO);
      }
    } else {
      rlText(ctx, B.px + B.pw / 2, B.py + B.ph / 2, 'no boosts in the chain',
             rgbCss(TH.faint), '12px ' + FONT_UI, 'center');
    }
    stageNote(ctx, 'the dashed line above is Galileo — it crosses the light barrier without noticing it is there  ·  ' +
      'the dashed line below is rapidity, rescaled, and it is straight', W, H);
  },
  readout(st){
    const w = relVelAdd(st.u, st.v);
    return `<div class="card tight"><div class="ttl">One composition</div>
      ${kv('u', fmtNum(st.u, 5) + ' c')}
      ${kv('v', fmtNum(st.v, 5) + ' c')}
      ${kv('Galileo:   u + v', fmtNum(st.u + st.v, 5) + ' c')}
      ${kv('Einstein: (u+v)/(1+uv/c²)', fmtNum(w, 7) + ' c')}
      ${kv('γ of the result', fmtNum(relGamma(Math.min(0.9999999, Math.abs(w))), 6))}
      ${kv('φ_u', fmtNum(relRapidity(st.u), 6))}
      ${kv('φ_v', fmtNum(relRapidity(st.v), 6))}
      ${kv('φ_u + φ_v', fmtNum(relRapidity(st.u) + relRapidity(st.v), 6))}
      ${kv('artanh of the composed speed', fmtNum(relRapidity(w), 6))}
      ${kv('residual', fmtAgree(relRapidity(w), relRapidity(st.u) + relRapidity(st.v)))}
      <p class="help">The residual is zero because the composition law <i>is</i> the addition formula for
      tanh. Feed either speed exactly c and the rule returns c — it was built to.</p>
    </div>` + rlVelChainCard(st);
  },
  /* Three rows, deliberately. The chip floats over the top-left of the upper
     plot, and the chain rows took it to five — far enough down to bury the
     light-barrier annotation it was meant to sit beside. The chain gets one
     line, not two. */
  chip(st){
    const w = relVelAdd(st.u, st.v);
    const M = rlVelChain(st).M;
    return `<div class="k">Velocity addition</div>
      <div><span style="color:var(--faint)">Galileo ${fmtNum(st.u + st.v, 4)}</span>
           <span style="color:var(--c-grad)"> → ${fmtNum(w, 6)} c</span></div>` +
      (M ? `<div style="color:var(--c-curl)">chain of ${M.n}: φ = ${fmtNum(M.phi, 4)}, ${
        M.saturated ? 'β = 1 in float64' : 'β = ' + fmtNum(M.betaA, 8)}</div>` : '');
  },
  legend(){ return [['var(--c-grad)', 'the relativistic sum'],
                    ['var(--faint)', 'u + v — the Galilean answer'],
                    ['var(--c-warn)', 'the light barrier at ±c'],
                    ['var(--c-curl)', 'rapidity, which adds without limit'],
                    ['var(--c-pos)', 'your chosen u']]; }
};

/* ---- 9 · the twin paradox --------------------------------------------------
   Not a paradox, and not really about acceleration: the twins take different
   routes between the same two events, and proper time is a property of a route.
   In Minkowski geometry the straight route is the LONGEST. */
