/* ============================================================================
   GROUP 3b · A COLLISION THE READER WRITES, AND A SOURCE THEY POINT
   The panel half of Programme A relativity items 19 (`rlDyn`) and 18
   (`rlDopp`); the arithmetic is in 46k-sr-collide.js. These two close the
   relativity block.
   ============================================================================ */

/* ---- item 19 · a collision -------------------------------------------------- */

function rlDynCur(st){
  if(st.xkey !== 'custom'){
    const P = RL_COLLIDES[st.xkey] || RL_COLLIDES.clay;
    return { name:P.name, short:P.short, before:P.before, after:P.after,
             conserves:P.conserves, why:P.why };
  }
  return { name:'your own reaction', short:'yours', own:true,
           before:st.xin === undefined ? RL_COLLIDES.clay.before : st.xin,
           after:st.xout === undefined ? RL_COLLIDES.clay.after : st.xout,
           conserves:null,
           why:'One particle per line: a <b>mass</b> and a <b>β</b>, then optionally an angle in degrees ' +
                'and a name. A massless particle takes β = ±1 and nothing else. The panel adds the ' +
                'four-momenta and asks three questions: is energy conserved, is momentum, and is the ' +
                '<b>invariant mass</b> the same before and after. The sum of the masses is not conserved ' +
                'and never was.' };
}
function rlDynMeasured(st){
  const C = rlDynCur(st);
  const key = C.before + '|' + C.after;
  if(st._col && st._col.key === key) return st._col;
  const B = rlCollideParse(C.before, []);
  const A = rlCollideParse(C.after, []);
  const M = rlCollideMeasure(B.parts, A.parts);
  M.key = key; M.C = C; M.errs = B.errs.concat(A.errs); M.inList = B.parts; M.outList = A.parts;
  st._col = M;
  return M;
}
function rlDynControls(st){
  const M = rlDynMeasured(st), C = M.C;
  const err = M.errs.length
    ? M.errs.map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('  ·  ') : '';
  return ctlRow('the reaction', ctSeg('rlDyK', st.xkey,
      Object.keys(RL_COLLIDES).map(k => [k, RL_COLLIDES[k].short]).concat([['custom', 'type your own']]))) +
    `<p class="help" style="margin-bottom:2px">coming in</p>
    <div class="fld" style="align-items:stretch">
      <textarea id="rlDyIn" rows="3" spellcheck="false" autocomplete="off"
        aria-label="incoming particles — one per line: mass, β, optional angle and name"
        data-audit="1.5 0.8 fast&#10;1 -0.2 slow"
        style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(C.before)}</textarea>
    </div>
    <p class="help" style="margin-bottom:2px">going out — leave empty to look at the incoming system alone</p>
    <div class="fld" style="align-items:stretch">
      <textarea id="rlDyOut" rows="3" spellcheck="false" autocomplete="off"
        aria-label="outgoing particles, in the same format"
        data-audit="3 0 the lump"
        style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(C.after)}</textarea>
    </div>
    <div class="row wrap">${ctBtn('rlDyGo', 'Add up the four-momenta')}</div>
    <p class="help" style="color:${err ? 'var(--c-neg)' : 'var(--faint)'}">${err ||
      (M.inList.length + ' in, ' + M.outList.length + ' out · <b>mass β</b>, then an optional angle in degrees and a name')}</p>
    <p class="help">${C.why || ''}</p>`;
}
function rlDynWire(){
  ctWireSeg('rlDyK', k => {
    ST.xkey = k;
    if(RL_COLLIDES[k]){ ST.xin = RL_COLLIDES[k].before; ST.xout = RL_COLLIDES[k].after; }
    ST._col = null;
  });
  const apply = () => {
    const a = $('rlDyIn'), b = $('rlDyOut');
    if(a) ST.xin = a.value;
    if(b) ST.xout = b.value;
    ST.xkey = 'custom'; ST._col = null;
    buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
  };
  for(const id of ['rlDyIn', 'rlDyOut']){ const e = $(id); if(e) e.addEventListener('change', apply); }
  const go = $('rlDyGo'); if(go) go.addEventListener('click', apply);
}

function rlDynFrame(st, ctx, W, H){
  const M = rlDynMeasured(st);
  if(!M.ok){ rlText(ctx, W / 2, H / 2, M.why, rgbCss(TH.neg), '12px ' + FONT_UI, 'center'); return; }
  /* each particle as an arrow in the (px, E) plane, stacked — so the sum is a
     visible tip-to-tail construction rather than a number in a table */
  const gap = 26, top = 56;
  const pw = (W - 3 * gap) / 2, ph = Math.max(90, H - top - 90);
  /* the window has to hold the TOTAL, not the largest single particle — the
     mass shell it sits on starts at E = m, and with the total off the top of
     the plot the shell is drawn entirely outside its own window */
  let eMax = 1e-9, pMax = 1e-9;
  for(const L of [M.inList, M.outList]) for(const p of L){
    const q = rlFourMomentum(p);
    eMax = Math.max(eMax, q.E); pMax = Math.max(pMax, Math.abs(q.px), Math.abs(q.py));
  }
  for(const q of [M.pin, M.pout]) if(q){
    eMax = Math.max(eMax, q.E, rlMassOf(q));
    pMax = Math.max(pMax, Math.abs(q.px), Math.abs(q.py));
  }
  const draw = (px, list, tot, title, tint) => {
    const P = mkPlot(px, top, pw, ph, -1.25 * Math.max(pMax, eMax * 0.4), 1.25 * Math.max(pMax, eMax * 0.4),
                     -0.1 * eMax, 1.35 * eMax);
    plotFrame(ctx, P, 'pₓ', 'E', title);
    plotZeroY(ctx, P);
    if(!list.length){
      rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2, 'nothing here', rgbCss(TH.faint),
             '12px ' + FONT_UI, 'center');
      return;
    }
    let ex = 0, ey = 0;
    for(const p of list){
      const q = rlFourMomentum(p);
      rlArrow(ctx, P.X(ex), P.Y(ey), P.X(ex + q.px), P.Y(ey + q.E), rgbCss(tint, 0.85), 2, 8);
      rlText(ctx, P.X(ex + q.px) + 5, P.Y(ey + q.E) - 4, p.name,
             rgbCss(tint, 0.9), '10px ' + FONT_MONO);
      ex += q.px; ey += q.E;
    }
    rlArrow(ctx, P.X(0), P.Y(0), P.X(ex), P.Y(ey), rgbCss(TH.curl), 2.6, 10);
    rlText(ctx, P.X(ex) + 6, P.Y(ey) + 14, 'total  E = ' + fmtNum(ey, 5) + ', pₓ = ' + fmtNum(ex, 5),
           rgbCss(TH.curl), '10.5px ' + FONT_MONO);
    /* the mass shell the total sits on */
    const m = rlMassOf(tot);
    const N = 120, xs = new Float64Array(N), ys = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const px2 = -1.4 * Math.max(pMax, eMax * 0.4) + 2.8 * Math.max(pMax, eMax * 0.4) * i / (N - 1);
      xs[i] = px2; ys[i] = Math.hypot(m, px2);
    }
    rlLine(ctx, P, xs, ys, rgbCss(TH.accent, 0.65), 1.6, [5, 4]);
    rlText(ctx, P.px + 8, P.py + 16, 'invariant mass ' + fmtNum(m, 6),
           rgbCss(TH.accent), '11px ' + FONT_MONO);
  };
  draw(gap, M.inList, M.pin, 'coming in', TH.grad);
  draw(2 * gap + pw, M.outList, M.pout || { E:0, px:0, py:0, pz:0 }, 'going out', TH.pos);
  stageNote(ctx, 'each arrow is one particle\'s four-momentum, laid tip to tail  ·  ' +
    'the dashed curve is the mass shell the TOTAL sits on, and it is the same one on both sides', W, H);
}

function rlDynReadout(st){
  const M = rlDynMeasured(st), C = M.C;
  if(!M.ok) return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    <p class="help" style="color:var(--c-neg)">${M.why}</p></div>`;
  const rows = L => L.map(p => kv(esc(p.name),
    'm = ' + fmtNum(p.m, 5) + ',  β = ' + fmtSig(p.beta, 5) +
    ',  E = ' + fmtNum(rlFourMomentum(p).E, 6))).join('');
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${rows(M.inList)}
    ${kv('total E in', fmtNum(M.pin.E, 8))}
    ${kv('total pₓ in', fmtNum(M.pin.px, 8))}
    ${kv('invariant mass √(E² − p²)', fmtNum(M.mIn, 8))}
    ${kv('sum of the individual masses', fmtNum(M.sumMIn, 8))}
    ${kv('and in a frame nobody chose (β = 0.63)', fmtAgreeGross(M.mInBoost, M.mIn, M.grossE))}
    <p class="help">The invariant mass is <b>not</b> the sum of the masses, and the difference is the
    kinetic energy carried in. It is the same number in every frame — the row above boosts the whole
    system by an arbitrary 0.63 and recomputes it — which is exactly what makes it worth having a name.
    ${C.why || ''}</p>
  </div>` + (M.outList.length ? `
  <div class="card tight"><div class="ttl">And what comes out</div>
    ${rows(M.outList)}
    ${kv('total E out', fmtNum(M.pout.E, 8))}
    ${kv('energy conserved?', fmtAgreeGross(M.pout.E, M.pin.E, M.grossE))}
    ${kv('momentum conserved?', fmtGap(M.dp, Math.max(1e-30, M.grossP)))}
    ${kv('invariant mass out', fmtNum(M.mOut, 8))}
    ${kv('against the mass in', fmtAgreeGross(M.mOut, M.mIn, M.grossE))}
    ${kv('sum of the masses, out − in', fmtSig(M.made, 6))}
    <p class="help">${M.conserves
      ? 'Energy and momentum both balance, so this is a reaction rather than a wish. ' +
        (Math.abs(M.made) > 1e-9
          ? 'And the <b>sum of the rest masses rose by ' + fmtSig(M.made, 5) + '</b> — the kinetic energy ' +
            'that stopped being kinetic did not vanish, it became mass. That is E = mc² as an ' +
            'arithmetic identity rather than a slogan, and it is where almost all of a proton\'s mass ' +
            'comes from: not from its quarks, which are nearly massless, but from the energy binding them.'
          : 'The rest masses are unchanged too, so this collision was elastic — nothing was made and ' +
            'nothing was heated.')
      : 'Energy or momentum does <b>not</b> balance here, so what you have written is not a reaction. ' +
        'The panel says so and prints by how much, against the total energy involved: an arrow between ' +
        'two lists is not a physical process, and this is the arithmetic that decides.'}</p>
    <p class="help">Note which quantity is conserved and which is not. <b>E and p</b> are conserved and
    the <b>invariant mass of the whole system</b> is conserved; the <b>sum of the individual masses</b>
    is not, and comparing that on the two sides is the commonest way to get this wrong.</p>
  </div>` : `
  <div class="card tight"><div class="ttl">Nothing written on the other side</div>
    <p class="help">Add outgoing particles to check whether the reaction balances. As it stands the panel
    is reporting the incoming system only — its total energy, its total momentum, and the invariant mass
    that any set of products must add back up to. That last number is the <b>whole budget</b>: no
    reaction can make more rest mass than ${fmtNum(M.mIn, 6)}, however the energy is arranged.</p>
  </div>`);
}
function rlDynChip(st){
  const M = rlDynMeasured(st);
  if(!M.ok) return `<div class="k">Collision</div><div style="color:var(--c-neg)">nothing in</div>`;
  return `<div class="k">Collision</div>
    <div style="color:var(--c-grad)">E = ${fmtNum(M.pin.E, 5)}, p = ${fmtNum(M.pin.px, 5)}</div>
    <div style="color:var(--accent)">mass ${fmtNum(M.mIn, 6)}</div>` +
    (M.outList.length ? `<div style="color:${M.conserves ? 'var(--c-pos)' : 'var(--c-neg)'}">${
      M.conserves ? 'conserved' : 'NOT conserved'}</div>` : '');
}

/* ---- item 18 · a source the reader points --------------------------------- */

const RL_SRC_BOUNDS = [{ k:'th', label:'angle θ (°)', def:60 }];
/* β comes from `st.beta` in BOTH branches, and a preset only seeds it when it
   is chosen. Returning the preset's own β instead left the slider reading 0.7
   while the picture was drawn at 0.8 — two controls for one quantity, and the
   reader has no way to tell which one the answer came from. */
function rlSrcCur(st){
  if(st.skey !== 'custom'){
    const P = RL_SOURCES[st.skey] || RL_SOURCES.fast;
    return { name:P.name, short:P.short, beta:st.beta, theta:P.theta, why:P.why };
  }
  const own = pkOwn(st, 'rlsrc', [], RL_SRC_BOUNDS);
  return { name:'your own source', short:'yours', own:true,
           beta:st.beta, theta:+own.th,
           why:'θ is measured in <b>your</b> frame, from the direction of motion. At 0° the source is ' +
                'coming straight at you and at 180° going straight away; at 90° there is no ' +
                'line-of-sight motion at all — and the signal is <i>still</i> redshifted, by exactly 1/γ.' };
}
function rlSrcControls(st){
  const C = rlSrcCur(st);
  return ctlRow('the source', ctSeg('rlDoK', st.skey,
      Object.keys(RL_SOURCES).map(k => [k, RL_SOURCES[k].short]).concat([['custom', 'type your own']]))) +
    pkBoxes('rlsrc', st.skey, st, [], RL_SRC_BOUNDS,
      'The angle in <b>your</b> frame, in degrees from the direction of motion.') +
    ctlRow('source speed β', ctlSlider('rlDoB', 0, 0.999, 0.001, st.beta)) +
    `<p class="help">The Doppler factor is <b>δ = 1/[γ(1 − β cos θ)]</b>, and the plot sweeps θ so all
    three regimes are on one curve. The one with no classical counterpart is <b>θ = 90°</b>, where there
    is no line-of-sight motion and the signal is redshifted anyway, by exactly 1/γ. ${C.why || ''}</p>`;
}
function rlSrcWire(){
  pkWire('rlDoK', 'rlsrc', ST.skey, ST, [], RL_SRC_BOUNDS,
         v => { ST.skey = v; if(RL_SOURCES[v]) ST.beta = RL_SOURCES[v].beta; });
  wireSlider('rlDoB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
}
function rlSrcFrame(st, ctx, W, H){
  const C = rlSrcCur(st);
  const b = Math.min(0.999, Math.max(-0.999, C.beta));
  const th = C.theta * Math.PI / 180;
  const R = rlBeamPower(b, th);
  const N = rlDopplerNull(b);
  const P = rlPanes(W, H, 34);
  const M = 400, ts = new Float64Array(M), ds = new Float64Array(M), fs = new Float64Array(M);
  let hi = 1e-9;
  for(let i = 0; i < M; i++){
    const a = Math.PI * i / (M - 1);
    ts[i] = a * 180 / Math.PI;
    ds[i] = relDoppler(b, a);
    fs[i] = Math.pow(ds[i], 4);
    hi = Math.max(hi, ds[i]);
  }
  const A = mkPlot(P.top.x, P.top.y + 14, P.top.w, P.top.h - 38, 0, 180, 0, 1.15 * hi);
  plotFrame(ctx, A, 'θ in your frame (degrees)', 'δ = ν′/ν',
    'The shift at every angle — and the one place it is pure time dilation');
  plotTicksX(ctx, A, [0, 45, 90, 135, 180], v => fmtNum(v, 3));
  rlSegment(ctx, A.px, A.Y(1), A.px + A.pw, A.Y(1), rgbCss(TH.faint, 0.8), 1.4, [5, 4]);
  rlText(ctx, A.px + 6, A.Y(1) - 10, 'δ = 1 — no shift at all', rgbCss(TH.faint), '10px ' + FONT_MONO);
  rlLine(ctx, A, ts, ds, rgbCss(TH.grad), 2.6);
  /* the transverse point, and the point where the shift actually vanishes */
  rlSegment(ctx, A.X(90), A.py, A.X(90), A.py + A.ph, rgbCss(TH.curl, 0.6), 1.4, [4, 4]);
  rlDot(ctx, A.X(90), A.Y(R.transverse), 5, rgbCss(TH.curl));
  rlText(ctx, A.X(90) + 7, A.Y(R.transverse) + 14,
         'transverse: 1/γ = ' + fmtNum(R.transverse, 5), rgbCss(TH.curl), '10.5px ' + FONT_MONO);
  if(N.ok){
    rlDot(ctx, A.X(N.theta * 180 / Math.PI), A.Y(1), 5, rgbCss(TH.warn));
    rlText(ctx, A.X(N.theta * 180 / Math.PI) + 7, A.Y(1) - 12,
           'unshifted at ' + fmtNum(N.theta * 180 / Math.PI, 4) + '°',
           rgbCss(TH.warn), '10.5px ' + FONT_MONO);
  }
  rlSegment(ctx, A.X(C.theta), A.py, A.X(C.theta), A.py + A.ph, rgbCss(TH.pos, 0.55), 1.2, [4, 4]);
  rlDot(ctx, A.X(C.theta), A.Y(R.delta), 5.5, rgbCss(TH.pos));

  /* bottom: the brightness, δ⁴, on a log scale by way of its own axis */
  const B = mkPlot(P.bot.x, P.bot.y + 14, P.bot.w, P.bot.h - 38, 0, 180, 0, 1.15 * Math.pow(hi, 4));
  plotFrame(ctx, B, 'θ (degrees)', 'brightness × δ⁴',
    'And the same source is brightened ahead and dimmed behind');
  plotTicksX(ctx, B, [0, 45, 90, 135, 180], v => fmtNum(v, 3));
  rlLine(ctx, B, ts, fs, rgbCss(TH.warn), 2.6);
  rlSegment(ctx, B.X(C.theta), B.py, B.X(C.theta), B.py + B.ph, rgbCss(TH.pos, 0.55), 1.2, [4, 4]);
  rlDot(ctx, B.X(C.theta), B.Y(Math.min(1.15 * Math.pow(hi, 4), R.total)), 5.5, rgbCss(TH.pos));
  rlText(ctx, B.px + 8, B.py + 16,
    'at your θ: δ = ' + fmtNum(R.delta, 6) + '   ·   δ⁴ = ' + fmtSig(R.total, 6) +
    '   ·   beam half-angle ' + fmtNum(R.beamHalfAngle * 180 / Math.PI, 4) + '°',
    rgbCss(TH.warn), '11px ' + FONT_MONO);
  stageNote(ctx, 'the marked angle on the left is where the shift vanishes — and it is NOT 90°, ' +
    'because time dilation has to be cancelled by a real approach first', W, H);
}
function rlSrcReadout(st){
  const C = rlSrcCur(st);
  const b = Math.min(0.999, Math.max(-0.999, C.beta));
  const R = rlBeamPower(b, C.theta * Math.PI / 180);
  const N = rlDopplerNull(b);
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('β, γ', fmtSig(b, 5) + ',  ' + fmtNum(relGamma(b), 7))}
    ${kv('θ in your frame', fmtNum(C.theta, 5) + '°')}
    ${kv('δ = ν′/ν', fmtNum(R.delta, 9))}
    ${kv('so the signal is', R.delta > 1 ? 'blueshifted' : R.delta < 1 ? 'redshifted' : 'unshifted')}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">The three regimes, and the one Newton cannot make</div>
    ${kv('straight at you  (θ = 0)', fmtNum(R.approaching, 8))}
    ${kv('straight away  (θ = 180°)', fmtNum(R.receding, 8))}
    ${kv('their product', fmtAgree(R.approaching * R.receding, 1))}
    ${kv('exactly side-on  (θ = 90°)', fmtNum(R.transverse, 9))}
    ${kv('which is 1/γ', fmtAgree(R.transverse, 1 / relGamma(b)))}
    ${kv('the angle at which nothing is shifted', N.ok ? fmtNum(N.theta * 180 / Math.PI, 6) + '°' : N.why)}
    <p class="help">The transverse row is the one with <b>no classical counterpart at all</b>: at 90°
    there is no line-of-sight motion, so a Newtonian calculation gives no shift whatever — and the
    signal is redshifted by exactly 1/γ. It is time dilation observed directly, and Ives and Stilwell
    measured it on a hydrogen ion beam in 1938.</p>
    <p class="help">And notice where the shift actually <i>vanishes</i>: ${N.ok
      ? 'at <b>' + fmtNum(N.theta * 180 / Math.PI, 5) + '°</b>, not at 90°. The classical null is at 90°; ' +
        'relativity pushes it forward, because the time-dilation redshift has to be cancelled by a real ' +
        'approach before the net shift can be zero.'
      : 'nowhere — ' + N.why + '.'}</p>
  </div>
  <div class="card tight"><div class="ttl">δ⁴, which is four different facts</div>
    ${kv('each photon is shifted by', fmtNum(R.energyPerPhoton, 7))}
    ${kv('and they arrive more often by', fmtNum(R.arrivalRate, 7))}
    ${kv('and the solid angle shrinks by', fmtNum(R.solidAngle, 7))}
    ${kv('so the brightness goes as', fmtSig(R.total, 8))}
    ${kv('the beam half-angle', fmtNum(R.beamHalfAngle * 180 / Math.PI, 6) + '°')}
    ${kv('and 1/γ, for comparison', fmtNum(1 / relGamma(b) * 180 / Math.PI, 6) + '°')}
    ${kv('fraction of the sky it is beamed into', fmtSig(R.beamFraction, 5))}
    <p class="help">"Brightened by δ⁴" is four things multiplied: the energy of each photon, the rate at
    which they arrive, and the two powers from the solid angle contracting. Two identical jets, one
    towards us and one away, differ in brightness by (δ_forward/δ_back)⁴ — at β = 0.99 that is a factor
    of millions, which is why relativistic jets so often look one-sided.</p>
  </div>`;
}
function rlSrcChip(st){
  const C = rlSrcCur(st);
  const b = Math.min(0.999, Math.max(-0.999, C.beta));
  const R = rlBeamPower(b, C.theta * Math.PI / 180);
  return `<div class="k">Doppler</div>
    <div style="color:var(--c-grad)">δ = ${fmtNum(R.delta, 6)}</div>
    <div style="color:var(--c-curl)">transverse 1/γ = ${fmtNum(R.transverse, 6)}</div>
    <div style="color:var(--c-warn)">δ⁴ = ${fmtSig(R.total, 5)}</div>`;
}
