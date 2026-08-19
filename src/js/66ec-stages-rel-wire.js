/* ============================================================================
   A WIRE THE READER COMPOSES
   The panel half of Programme A relativity item 9; the arithmetic is in
   46g-sr-charges.js. It is a third MODE of `rlWire` rather than a replacement,
   because the two existing modes carry SI numbers pinned by the test suite —
   a household wire's 10⁻¹³ drift and its 10⁻¹⁷ charge imbalance — and this one
   works in the reader's own units with c = 1, where the interesting quantities
   are the ratio between the two frames and the number of digits the naive
   route has left.
   ============================================================================ */

function rlWireSheetControls(st){
  const C = rlWCur(st);
  const err = C.errs && C.errs.length
    ? C.errs.map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('  ·  ') : '';
  const L = rlWireLab(C.species);
  return ctlRow('the wire', ctSeg('rlWiK', st.wkeyw,
      Object.keys(RL_WIRES).map(k => [k, RL_WIRES[k].short]).concat([['custom', 'type your own']]))) +
    `<div class="fld" style="align-items:stretch">
      <textarea id="rlWiS" rows="4" spellcheck="false" autocomplete="off"
        aria-label="carrier species — one per line: a lab linear density, a drift speed, and a name"
        data-audit="2 0 lattice&#10;-1 0.6 electrons"
        style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.wkeyw === 'custom' ? (st.wsheet === undefined ? RL_W_SHEET : st.wsheet) : (RL_WIRES[st.wkeyw] || RL_WIRES.neutral).text)}</textarea>
    </div>
    <div class="row wrap">${ctBtn('rlWiGo', 'Rebuild the wire')}</div>
    <p class="help" style="color:${err ? 'var(--c-neg)' : 'var(--faint)'}">${err ||
      (C.species.length + ' species · net λ = ' + fmtNear(L.lam) + ', current I = ' + fmtNum(L.I, 6) +
       ' · ' + (Math.abs(L.lam) < 1e-12 ? 'neutral in the lab' : '<b>charged</b> in the lab'))}</p>` +
    ctlRow('test charge β', ctlSlider('rlWiT', -0.95, 0.95, 0.005, C.vt)) +
    `<p class="help">One carrier species per line: a <b>lab</b> linear density and a drift speed.
    Neutrality is whatever your densities sum to — it is <b>measured</b>, not assumed — so a wire that
    is charged in the lab is a legal thing to build, and the frames still agree about the force.
    ${C.why || ''}</p>`;
}
function rlWireSheetWire(){
  ctWireSeg('rlWiK', k => {
    ST.wkeyw = k;
    if(RL_WIRES[k]){ ST.wsheet = RL_WIRES[k].text; ST.wvt = RL_WIRES[k].vt; }
  });
  const apply = () => {
    const box = $('rlWiS'); if(!box) return;
    ST.wsheet = box.value; ST.wkeyw = 'custom';
    buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
  };
  const b = $('rlWiS'); if(b) b.addEventListener('change', apply);
  const go = $('rlWiGo'); if(go) go.addEventListener('click', apply);
  wireSlider('rlWiT', () => (ST.wvt === undefined ? 0.4 : ST.wvt), v => { ST.wvt = v; },
             rlBetaFmt, RL_BETA_LIM);
}

/* The picture: the species as rows of moving charges, the test charge beside
   them, and the two force ledgers. The densities are drawn as spacing, because
   that is what length contraction does to them and it is the only way the
   argument is visible rather than asserted. */
function rlWireSheetFrame(st, ctx, W, H){
  const C = rlWCur(st);
  const F = rlWireForce(C.species, C.vt, 1, 1);
  const rows = C.species.length;
  const top = 56, rowH = Math.min(42, (H - top - 150) / Math.max(1, rows));
  const x0 = 70, x1 = W * 0.60;

  rlText(ctx, ctTitleClearChip(ctx, (x0 + x1) / 2, 34, 'the wire, in the lab'), 34,
         'the wire, in the lab', rgbCss(TH.text), '600 12.5px ' + FONT_UI, 'center');

  C.species.forEach((s, i) => {
    const y = top + rowH * (i + 0.5);
    rlSegment(ctx, x0, y, x1, y, rgbCss(TH.line2, 0.6), 1);
    /* spacing ∝ 1/|λ| so a denser species really looks denser */
    const n = Math.max(2, Math.min(60, Math.round(Math.abs(s.lam) * 26)));
    const col = s.lam >= 0 ? TH.pos : TH.neg;
    for(let k = 0; k <= n; k++){
      const x = x0 + (x1 - x0) * k / n;
      rlDot(ctx, x, y, 3.2, rgbCss(col, 0.9));
    }
    if(Math.abs(s.v) > 1e-9)
      rlArrow(ctx, x1 + 8, y, x1 + 8 + 30 * Math.sign(s.v), y, rgbCss(TH.mid), 1.8, 7);
    rlText(ctx, x1 + 46, y + 4, s.name + '  λ = ' + fmtNum(s.lam, 4) + ', β = ' + fmtSig(s.v, 3),
           rgbCss(col), '10.5px ' + FONT_MONO);
  });

  /* the test charge, below the wire, with its own arrow */
  const ty = top + rowH * rows + 34;
  rlDot(ctx, (x0 + x1) / 2, ty, 6, rgbCss(TH.warn), rgbCss(TH.bg));
  if(Math.abs(C.vt) > 1e-9)
    rlArrow(ctx, (x0 + x1) / 2 + 10, ty, (x0 + x1) / 2 + 10 + 34 * Math.sign(C.vt), ty,
            rgbCss(TH.warn), 2, 8);
  rlText(ctx, (x0 + x1) / 2 + 56, ty + 4, 'test charge, β = ' + fmtSig(C.vt, 4),
         rgbCss(TH.warn), '10.5px ' + FONT_MONO);
  /* and the force on it, as an arrow across the wire */
  const fs = Math.max(-1, Math.min(1, F.lab / Math.max(1e-30, Math.abs(F.lab)) *
    Math.min(1, Math.abs(F.lab) / Math.max(1e-30, Math.abs(F.lab)))));
  rlArrow(ctx, (x0 + x1) / 2, ty, (x0 + x1) / 2, ty - 26 * (F.lab > 0 ? -1 : 1),
          rgbCss(TH.curl), 2.4, 9);
  rlText(ctx, (x0 + x1) / 2 - 8, ty - 26 * (F.lab > 0 ? -1 : 1) - 6,
         'F = ' + fmtSig(F.lab, 4), rgbCss(TH.curl), '10.5px ' + FONT_MONO, 'right');

  /* the ledger */
  let by = top + rowH * rows + 92;
  const bx = 70, bw = Math.min(W - 140, 620);
  const line = (lbl, val, col) => {
    rlText(ctx, bx, by, lbl, rgbCss(TH.dim), '11.5px ' + FONT_UI);
    rlText(ctx, bx + bw, by, val, rgbCss(col), '11.5px ' + FONT_MONO, 'right');
    by += 19;
  };
  line('lab: net λ = ' + fmtNear(F.lam) + ',  I = ' + fmtNum(F.I, 5),
       'E = ' + fmtNear(F.E) + ',  B = ' + fmtNum(F.B, 5), TH.grad);
  line('lab force  q(E − βB)', fmtSig(F.lab, 10), TH.warn);
  line("in the charge's own frame, purely electric, ÷ γ", fmtSig(F.viaExact, 10), TH.pos);
  line('the same, summed species by species', fmtSig(F.viaNaive, 10), TH.faint);
  line('digits the species-by-species sum has left',
       fmtNum(Math.max(0, 16 - F.prime.digits), 3) + ' of 16', TH.neg);
  stageNote(ctx, 'dots are charge density, drawn as spacing  ·  ' +
    'the two frames disagree about what the force IS and agree about how big it is', W, H);
}

function rlWireSheetReadout(st){
  const C = rlWCur(st);
  const F = rlWireForce(C.species, C.vt, 1, 1);
  const rows = C.species.map(s =>
    kv(esc(s.name), 'λ = ' + fmtNum(s.lam, 5) + ',  β = ' + fmtSig(s.v, 4) +
       ',  proper λ₀ = ' + fmtNum(s.lam / relGamma(s.v), 5))).join('');
  const naiveBad = Math.abs(F.viaNaive - F.lab) > 1e-6 * Math.abs(F.lab);
  return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
    ${rows}
    ${kv('net λ in the lab', fmtNear(F.lam) + (F.neutral ? '  — neutral' : '  — charged'))}
    ${kv('current I', fmtNum(F.I, 6))}
    <p class="help">${C.why || ''}</p>
  </div>
  <div class="card tight"><div class="ttl">The same force, computed in two frames</div>
    ${kv('lab: E = 2λ/d', fmtNear(F.E))}
    ${kv('lab: B = 2I/d', fmtNum(F.B, 6))}
    ${kv('lab: F = q(E − βB)', fmtSig(F.lab, 10))}
    ${kv("charge's frame: λ′ (closed form)", fmtSig(F.prime.exact, 10))}
    ${kv("charge's frame: F′ = 2qλ′/d", fmtSig(F.restExact, 10))}
    ${kv('÷ γ, because a transverse force does that', fmtSig(F.viaExact, 10))}
    ${kv('difference', fmtAgreeGross(F.lab, F.viaExact, F.gross))}
    <p class="help">The lab calls this force <b>magnetic</b> — with a neutral wire there is no electric
    field at all — and the charge's own frame calls it <b>electrostatic</b>, because there the wire is
    charged and nothing is moving relative to the charge. Same force, same number, two irreconcilable
    stories about what it is. That is the observation Einstein opens the 1905 paper with.</p>
  </div>
  <div class="card tight"><div class="ttl">And what the argument costs in arithmetic</div>
    ${kv('λ′ by summing the species one at a time', fmtSig(F.prime.naive, 10))}
    ${kv('λ′ in closed form', fmtSig(F.prime.exact, 10))}
    ${kv('Σ|λ′ᵢ| — what those two came out of', fmtSig(F.prime.gross, 6))}
    ${kv('difference between the two routes', fmtAgreeGross(F.prime.naive, F.prime.exact, F.prime.gross))}
    ${kv('decimal digits lost to cancellation', fmtNum(F.prime.digits, 4))}
    <p class="help">${naiveBad
      ? 'At this drift speed the species-by-species sum has <b>nothing left</b>. That is not a coding ' +
        'problem, it is the physics: the imbalance carrying the entire magnetic force is ' +
        fmtSig(Math.pow(10, -F.prime.digits), 3) + ' of either density. The closed form uses the exact ' +
        'identity γ(v′) = γ(v)γ(βₜ)(1 − vβₜ) to collapse the difference <i>before</i> anything cancels, ' +
        'which is the only way to compute it at a real drift speed.'
      : 'Here the two routes still agree, because the drift speed is large enough that the imbalance is ' +
        'a respectable fraction of the densities. Load the <b>realistic</b> preset — electrons drifting ' +
        'at 3×10⁻¹³ — and watch the species-by-species sum lose every digit it has, while the closed ' +
        'form does not move. The effect that runs every motor on Earth is a part in 10¹⁷ of a number ' +
        'nobody can measure directly.'}</p>
  </div>`;
}

function rlWireSheetChip(st){
  const C = rlWCur(st);
  const F = rlWireForce(C.species, C.vt, 1, 1);
  return `<div class="k">Wire</div>
    <div style="color:var(--c-grad)">λ = ${fmtNear(F.lam)}, I = ${fmtNum(F.I, 4)}</div>
    <div style="color:var(--c-warn)">F = ${fmtSig(F.lab, 5)}</div>
    <div style="color:var(--c-pos)">both frames: ${fmtAgreeTight(F.lab, F.viaExact)}</div>`;
}
