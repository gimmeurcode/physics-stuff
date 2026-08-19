/* ============================================================================
   A CHARGE CONFIGURATION THE READER SUPPLIES, AND GAUSS'S LAW UNDER A BOOST
   The panel half of Programme A relativity item 6; the arithmetic is in
   46g-sr-charges.js.

   Why this mode exists, in one sentence: the stage's own derivation ladder has
   always said "the panel integrates it in the boosted frame and gets the same
   answer" — and the panel never integrated anything. It does now.
   ============================================================================ */

/* cached: the surface integral costs about ten milliseconds and frame() runs
   sixty times a second */
function rlGaussMeasured(st){
  const C = rlQCur(st);
  const key = C.charges.map(c => [c.q, c.p.x, c.p.y, c.p.z, c.beta].join(',')).join(';') +
              '|' + C.cx + '|' + C.R;
  if(st._gz && st._gz.key === key) return st._gz;
  const M = rlGaussMeasure(C.charges, v3(C.cx, C.cy, C.cz), C.R);
  M.key = key; M.C = C;
  st._gz = M;
  return M;
}

function rlGaussControls(st){
  const C = rlQCur(st);
  const err = C.errs && C.errs.length
    ? C.errs.map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('  ·  ') : '';
  return ctlRow('the charges', ctSeg('rbQK', st.qkey,
      Object.keys(RL_CHARGES).map(k => [k, RL_CHARGES[k].short]).concat([['custom', 'type your own']]))) +
    `<div class="fld" style="align-items:stretch">
      <textarea id="rbQS" rows="4" spellcheck="false" autocomplete="off"
        aria-label="charges — one per line: q, x, y, z, and optionally a speed along x"
        data-audit="1 0 0 0 0.8&#10;-1 1.2 0 0 0.8"
        style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.qkey === 'custom' ? (st.qsheet === undefined ? RL_Q_SHEET : st.qsheet) : (RL_CHARGES[st.qkey] || RL_CHARGES.one).text)}</textarea>
    </div>
    <div class="row wrap">${ctBtn('rbQGo', 'Integrate the flux')}</div>
    <p class="help" style="color:${err ? 'var(--c-neg)' : 'var(--faint)'}">${err ||
      (C.charges.length + ' charge' + (C.charges.length === 1 ? '' : 's') +
       ' · one per line: <b>q x y z</b>, or <b>q x y z β</b> to send it along x')}</p>` +
    (st.qkey === 'custom'
      ? ctlRow('sphere radius', ctlSlider('rbQR', 0.4, 6, 0.05, C.R)) +
        ctlRow('sphere centre x', ctlSlider('rbQC', -4, 4, 0.05, C.cx))
      : '') +
    `<p class="help">The sphere is integrated over, twice. Once in the <b>lab</b>, where a moving
    charge's field is a pancake — γ³ times stronger across the motion than along it — and once in the
    charges' own frame, where the field is plain Coulomb but the same physical surface is an
    <b>ellipsoid</b>. Different surface, different integrand, same answer: <b>4πq</b> for whatever
    charge is inside, and <b>zero</b> for anything outside. ${C.why || ''}</p>`;
}
function rlGaussWire(){
  ctWireSeg('rbQK', k => {
    ST.qkey = k;
    if(RL_CHARGES[k]){ ST.qsheet = RL_CHARGES[k].text; ST.qcx = RL_CHARGES[k].cx; ST.qR = RL_CHARGES[k].R; }
    ST._gz = null;
  });
  const apply = () => {
    const box = $('rbQS'); if(!box) return;
    ST.qsheet = box.value; ST.qkey = 'custom'; ST._gz = null;
    buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
  };
  const b = $('rbQS'); if(b) b.addEventListener('change', apply);
  const go = $('rbQGo'); if(go) go.addEventListener('click', apply);
  if(ST.qkey === 'custom'){
    wireSlider('rbQR', () => (ST.qR === undefined ? 2 : ST.qR), v => { ST.qR = v; ST._gz = null; },
               v => fmtNum(+v, 3));
    wireSlider('rbQC', () => (ST.qcx === undefined ? 0 : ST.qcx), v => { ST.qcx = v; ST._gz = null; },
               v => fmtNum(+v, 3));
  }
}

/* The picture: a slice through z = 0 showing the charges, the sphere's
   cross-section, and E·n̂ sampled around it — drawn as spikes off the circle, so
   the pancake is visible as the shape of the thing being integrated rather
   than as a claim in the caption. */
function rlGaussFrame(st, ctx, W, H){
  const M = rlGaussMeasured(st), C = M.C;
  let ext = C.R * 1.4;
  for(const c of C.charges) ext = Math.max(ext, Math.abs(c.p.x - C.cx) * 1.25 + 0.5, Math.abs(c.p.y) * 1.25 + 0.5);
  const size = Math.min(W * 0.52, H - 96);
  const cx = W * 0.30, cy = 48 + size / 2, sc = size / (2 * ext);
  const X = x => cx + (x - C.cx) * sc, Y = y => cy - y * sc;

  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
  ctx.save(); ctx.beginPath(); ctx.rect(cx - size / 2, cy - size / 2, size, size); ctx.clip();

  /* the sphere's cross-section */
  ctx.strokeStyle = rgbCss(TH.grad, 0.9); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(X(C.cx), Y(0), C.R * sc, 0, 6.2832); ctx.stroke();

  /* E·n̂ around it, as spikes — outward positive, inward negative */
  const N = 180;
  let peak = 1e-30;
  const vals = new Float64Array(N);
  for(let i = 0; i < N; i++){
    const th = 2 * Math.PI * i / N;
    const n = v3(Math.cos(th), Math.sin(th), 0);
    const P = vadd(v3(C.cx, C.cy, C.cz), vmul(n, C.R));
    vals[i] = vdot(rlChargeField(C.charges, P).E, n);
    peak = Math.max(peak, Math.abs(vals[i]));
  }
  for(let i = 0; i < N; i++){
    const th = 2 * Math.PI * i / N;
    const n = v3(Math.cos(th), Math.sin(th), 0);
    const L = 0.30 * C.R * sc * vals[i] / peak;
    const x0 = X(C.cx + n.x * C.R), y0 = Y(n.y * C.R);
    rlSegment(ctx, x0, y0, x0 + n.x * L, y0 - n.y * L,
              rgbCss(vals[i] >= 0 ? TH.warn : TH.neg, 0.75), 1.4);
  }
  /* the charges */
  for(const c of C.charges){
    const r = 4 + 3 * Math.min(2, Math.abs(c.q));
    rlDot(ctx, X(c.p.x), Y(c.p.y), r, rgbCss(c.q >= 0 ? TH.pos : TH.neg), rgbCss(TH.bg));
    if(Math.abs(c.beta) > 1e-9)
      rlArrow(ctx, X(c.p.x), Y(c.p.y), X(c.p.x) + 26 * Math.sign(c.beta), Y(c.p.y),
              rgbCss(TH.mid), 1.8, 7);
  }
  ctx.restore();

  /* the ledger: what came out against what is inside */
  const bx = W * 0.62, bw = Math.min(W * 0.33, 340);
  let by = 74;
  const line = (lbl, val, col) => {
    rlText(ctx, bx, by, lbl, rgbCss(TH.dim), '11.5px ' + FONT_UI);
    rlText(ctx, bx + bw, by, val, rgbCss(col), '11.5px ' + FONT_MONO, 'right');
    by += 20;
  };
  ctx.font = '600 12.5px ' + FONT_UI;
  rlText(ctx, ctTitleClearChip(ctx, bx + bw / 2, 46, C.name), 46, C.name,
         rgbCss(TH.text), '600 12.5px ' + FONT_UI, 'center');
  if(!M.ok){
    rlText(ctx, bx, by, 'no flux to report', rgbCss(TH.neg), '11.5px ' + FONT_UI);
  } else {
    line('charge inside the sphere', fmtNum(M.enclosed, 6), TH.pos);
    line('4π × that', fmtNum(M.expect, 8), TH.faint);
    line('∮E·dA, integrated in the lab', fmtNum(M.lab, 8), TH.warn);
    if(M.rest !== undefined) line('∮E·dA over the rest-frame ellipsoid', fmtNum(M.rest, 8), TH.pos);
    line('∮|E|dA — what the total is made of', fmtNum(M.gross, 6), TH.faint);
    by += 6;
    line('γ of the fastest charge', fmtNum(M.gamma, 5), TH.curl);
    line('polar × azimuthal samples', M.nu + ' × ' + M.nphi, TH.faint);
  }
  stageNote(ctx, 'the spikes are E·n̂ around the sphere — orange out, blue in  ·  ' +
    'the total is 4πq for whatever is inside, however the field is distorted getting there', W, H);
}

function rlGaussReadout(st){
  const M = rlGaussMeasured(st), C = M.C;
  const head = `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${kv('charges', C.charges.length)}
    ${kv('sphere', 'centre x = ' + fmtNum(C.cx, 4) + ', radius ' + fmtNum(C.R, 4))}`;
  if(!M.ok) return head + `<p class="help" style="color:var(--c-neg)">${M.why}</p></div>`;
  const zero = Math.abs(M.enclosed) < 1e-12;
  return head +
    `${kv('enclosed charge', fmtNum(M.enclosed, 6))}
    ${kv('γ of the fastest', fmtNum(M.gamma, 6))}
    <p class="help">${C.why || ''}</p>
    </div>
    <div class="card tight"><div class="ttl">Gauss's law, integrated rather than quoted</div>
      ${kv('4πq for the charge inside', fmtNum(M.expect, 9))}
      ${kv('∮E·dA over the sphere, in the lab', fmtNum(M.lab, 9))}
      ${kv('difference', zero ? fmtAgreeGross(M.lab, M.expect, M.gross) : fmtAgree(M.lab, M.expect))}
      ${M.rest !== undefined ? kv('∮E·dA over the same events, at rest', fmtNum(M.rest, 9)) : ''}
      ${M.rest !== undefined ? kv('lab against rest frame',
          zero ? fmtAgreeGross(M.lab, M.rest, M.gross) : fmtAgree(M.lab, M.rest)) : ''}
      ${kv('∮|E|dA — the gross the total came out of', fmtNum(M.gross, 6))}
      ${kv('the grid it took', M.nu + ' polar × ' + M.nphi + ' azimuthal samples')}
      <p class="help">${zero
        ? 'The enclosed charge is <b>zero</b>, so this total is a <b>cancellation</b> — and a residual ' +
          'against a zero answer means nothing without the size of what cancelled. The gross ∮|E|dA is ' +
          'that size, and the field is emphatically not zero anywhere on the surface. What goes in ' +
          'comes out: that is the half of Gauss\'s law people forget.'
        : 'A charge in motion has a field <b>γ³ times stronger</b> across its motion than along it — at ' +
          'γ = ' + fmtNum(M.gamma, 4) + ' that is a factor of ' + fmtSig(Math.pow(M.gamma, 3), 4) + ' between ' +
          'two points on the same sphere. Every part of the integral is therefore wildly different from ' +
          'its rest-frame value, and the total is not. That is charge invariance, and it is measured ' +
          'here rather than asserted.'}</p>
      <p class="help">The second route is not the first one rearranged: the lab sphere's events are an
      <b>ellipsoid</b> in the rest frame, and the integral there uses that ellipsoid's own area element,
      taken as ∂P/∂θ × ∂P/∂φ rather than derived by hand. What the two share is the events they pass
      through.</p>
    </div>`;
}

function rlGaussChip(st){
  const M = rlGaussMeasured(st);
  if(!M.ok) return `<div class="k">Gauss</div><div style="color:var(--c-neg)">no flux</div>`;
  return `<div class="k">∮E·dA</div>
    <div style="color:var(--c-warn)">${fmtNum(M.lab, 7)}</div>
    <div style="color:var(--c-pos)">4πq = ${fmtNum(M.expect, 7)}</div>
    <div style="color:var(--c-grad)">γ = ${fmtNum(M.gamma, 4)}</div>`;
}
