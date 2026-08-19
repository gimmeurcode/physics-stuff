/* ============================================================================
   GROUP 4b · THE FIELD THE READER SUPPLIES
   The panel half of Programme A relativity items 7 (rlEB) and 8 (rlTensor);
   the arithmetic is in 46f-sr-fields.js. Split out of 66e, which was already
   at its size budget with three stages in it.
   ============================================================================ */

/* ---- item 7 · a field the reader types ------------------------------------- */

function rlEbControls(st){
  const C = rlEbCur(st);
  return ctlRow('the field', pkSeg('rlEbK', RL_FIELDS, st.fkey, e => e.short || e.name)) +
    pkBoxes('rleb', st.fkey, st, [], RL_EB_BOUNDS,
      'Six numbers, in units with c = 1 so E and B are the same kind of quantity. ' +
      'Expressions are fine — <b>1/2</b>, <b>sqrt(2)</b>, <b>pi/4</b>.') +
    ctlRow('boost β (along x)', ctlSlider('rlEbV', -0.98, 0.98, 0.005, st.beta)) +
    `<p class="help">Set any field; the right-hand picture is what an observer moving along <b>x</b>
    measures. Components <i>along</i> the boost are untouched; the perpendicular ones mix:
    <b>E′⊥ = γ(E + v×B)⊥</b> and <b>B′⊥ = γ(B − v×E)⊥</b>. The lower plot sweeps β and draws the two
    invariants — they are flat lines, which is the entire point. ${C.why || ''}</p>`;
}
function rlEbWire(){
  pkWire('rlEbK', 'rleb', ST.fkey, ST, [], RL_EB_BOUNDS, v => { ST.fkey = v; });
  wireSlider('rlEbV', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
}

/* The two cards the editor adds. The first is the one that turns a
   classification into a measurement: "a frame exists where B vanishes" names a
   frame, so the panel goes to it. The second is the two-route row — the six
   component formulas against Λ F Λᵀ with Λ in a general direction, which is
   the only place in this wing where "E and B are one object" is checked off
   the x axis. */
function rlEbDriftCard(st){
  const C = rlEbCur(st);
  const D = rlFieldDrift(C.E, C.B);
  const c3 = v => '(' + fmtNum(v.x, 4) + ',  ' + fmtNum(v.y, 4) + ',  ' + fmtNum(v.z, 4) + ')';
  const R = rlFieldBoostTwo(C.E, C.B, v3(st.beta, 0, 0));
  const routes = `${kv('the six component formulas', c3(R.vec.E) + '  ·  ' + c3(R.vec.B))}
      ${kv('Λ F Λᵀ, read back off the tensor', c3(R.ten.E) + '  ·  ' + c3(R.ten.B))}
      ${kv('difference', fmtAgreeGross(0, R.worst, R.gross))}`;
  if(!D.ok)
    return `<div class="card tight"><div class="ttl">Is there a frame that removes one of them?</div>
      ${kv('this field is', D.character)}
      ${kv('the answer', 'no')}
      <p class="help">${D.why}</p>
      ${routes}
      <p class="help">Two routes to the boosted field, sharing no arithmetic: the component formulas,
      and building the tensor, conjugating it and reading E and B back out.</p>
    </div>`;
  const removed = D.removes === 'magnetic' ? 'B' : D.removes === 'electric' ? 'E' : null;
  const leftOver = D.removes === 'magnetic' ? D.bLeft : D.removes === 'electric' ? D.eLeft : null;
  return `<div class="card tight"><div class="ttl">The frame the classification promises</div>
    ${kv('this field is', D.character)}
    ${kv('the boost that gets there', fmtNum(D.speed, 6) + ' c,  along ' + c3(vmul(D.v, D.speed > 0 ? 1 / D.speed : 0)))}
    ${kv('E there', c3(D.E))}
    ${kv('B there', c3(D.B))}
    ${removed
      ? kv('what is left of ' + removed + ', against the field it came from', fmtGap(leftOver, D.gross))
      : kv('|E×B| there, against |E||B|', fmtGap(D.parallel, 1))}
    <p class="help">${removed
      ? 'The invariants say a frame exists in which the ' + (removed === 'B' ? 'magnetic' : 'electric') +
        ' field vanishes. That is a claim about a <b>frame</b>, so the panel goes to it and measures ' +
        'what survives — printed against the size of the field it started from, because a residual ' +
        'that is supposed to be zero cannot be scaled against itself. The magnetism was never a ' +
        'separate substance; it was this field, catalogued by an observer in motion.'
      : 'Because <b>E·B ≠ 0</b> no boost removes either field — but one still makes them <b>parallel</b>, ' +
        'and after that they stay parallel in every frame reachable from it. That frame is found by ' +
        'solving v/(1 + v²) = |E×B|/(E² + B²) rather than by the E×B drift formula, which is the ' +
        'parallel frame only when E·B = 0 and was wrong here until 2026-08-19.'}</p>
    ${routes}
    <p class="help">Two routes to the boosted field, sharing no arithmetic: the component formulas
    above, and building <b>F<sup>μν</sup></b>, conjugating it by <b>Λ</b> and reading E and B back
    out. That they agree is the claim "E and B are six components of one object", measured.</p>
  </div>`;
}

/* ---- item 8 · a tensor the reader types ------------------------------------ */

function rlTnControls(st){
  const C = rlTnCur(st);
  const err = C.errs && C.errs.length
    ? C.errs.map(e => (e.line ? 'row ' + e.line + ': ' : '') + e.msg).join('  ·  ') : '';
  return ctlRow('the tensor', ctSeg('rlTnK', st.tkey,
      Object.keys(RL_TENSORS).map(k => [k, RL_TENSORS[k].short]).concat([['custom', 'type your own']]))) +
    `<div class="fld" style="align-items:stretch">
      <textarea id="rlTnS" rows="4" spellcheck="false" autocomplete="off"
        aria-label="the field tensor — four rows of four numbers"
        data-audit="0 -1 0 0&#10;1 0 0 0&#10;0 0 0 -1&#10;0 0 1 0"
        style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.tkey === 'custom' ? (st.tsheet === undefined ? RL_TN_SHEET : st.tsheet) : (RL_TENSORS[st.tkey] || RL_TENSORS.general).text)}</textarea>
    </div>
    <div class="row wrap">${ctBtn('rlTnGo', 'Read this tensor')}</div>
    <p class="help" style="color:${err ? 'var(--c-neg)' : 'var(--faint)'}">${err ||
      ('F<sup>μν</sup> = ' + C.name + ' — four rows of four, whitespace-separated. Lines beginning # are comments.')}</p>` +
    ctlRow('boost β (along x)', ctlSlider('rlTnB', -0.97, 0.97, 0.005, st.beta)) +
    `<p class="help">The matrix on the left is <b>F<sup>μν</sup></b>: six independent numbers, three of
    them E and three of them B, arranged antisymmetrically. The boost is <b>Λ<sup>μ</sup><sub>ν</sub></b>
    in the middle, and the field in the new frame is nothing more exotic than <b>F′ = Λ F Λᵀ</b>.
    ${C.why || ''}</p>`;
}
function rlTnWire(){
  ctWireSeg('rlTnK', k => {
    ST.tkey = k;
    if(RL_TENSORS[k]) ST.tsheet = RL_TENSORS[k].text;
  });
  const apply = () => {
    const box = $('rlTnS'); if(!box) return;
    ST.tsheet = box.value; ST.tkey = 'custom';
    buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
  };
  const b = $('rlTnS'); if(b) b.addEventListener('change', apply);
  const go = $('rlTnGo'); if(go) go.addEventListener('click', apply);
  wireSlider('rlTnB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
}

/* What the typed tensor IS, measured off the sixteen numbers: whether it is
   antisymmetric at all, what E and B it carries, and both invariants rebuilt
   from the double contractions rather than from the vectors. */
function rlTnCard(st){
  const C = rlTnCur(st);
  if(!C.F || C.F.length !== 4)
    return `<div class="card tight"><div class="ttl">The tensor</div>
      <p class="help" style="color:var(--c-neg)">That is not four rows of four numbers, so there is
      nothing to read. The previous tensor is still on the picture.</p></div>`;
  const K = rlTensorCheck(C.F);
  const anti = K.anti <= 1e-12 * K.scale;
  const c3 = v => '(' + fmtNum(v.x, 4) + ',  ' + fmtNum(v.y, 4) + ',  ' + fmtNum(v.z, 4) + ')';
  return `<div class="card tight"><div class="ttl">Sixteen numbers, and what they are</div>
    ${kv('antisymmetric?', anti ? 'yes' : 'NO — this is not a field tensor')}
    ${kv('worst |F^μν + F^νμ|', fmtGap(K.anti, K.scale))}
    ${kv('largest diagonal entry', fmtGap(K.diag, K.scale))}
    ${kv('E read off the time row', c3(K.E))}
    ${kv('B read off the space block', c3(K.B))}
    <p class="help">${anti
      ? 'Antisymmetry is <b>measured</b>, not assumed: 4×3/2 = 6 independent entries, which is exactly ' +
        'how many field components electromagnetism has. The count is not a coincidence — the ' +
        'structure of spacetime fixes it.'
      : 'The symmetric part is not a field. A stage that silently deleted it would be teaching the ' +
        'opposite of the lesson, so the panel reports it instead: the residual above is against the ' +
        'largest entry, because an antisymmetry gap of 10⁻⁹ means one thing on entries of order 1 ' +
        'and another on entries of order 10⁹.'}</p>
  </div>
  <div class="card tight"><div class="ttl">The invariants, twice</div>
    ${kv('E·B      from the vectors', fmtNear(K.dot))}
    ${kv('  and from F_μν F̃^μν / (−4)', fmtNear(K.fromTensorDot))}
    ${kv('difference', fmtAgreeGross(K.dot, K.fromTensorDot, K.scale * K.scale))}
    ${kv('E² − B²  from the vectors', fmtNum(K.diff, 6))}
    ${kv('  and from F_μν F^μν / (−2)', fmtNum(K.fromTensorDiff, 6))}
    ${kv('difference', fmtAgreeGross(K.diff, K.fromTensorDiff, K.scale * K.scale))}
    ${kv('so this field is', K.character)}
    <p class="help">The two contractions are scalars built from the sixteen components with no mention
    of E or B; the two dot and difference forms are built from the vectors with no mention of the
    tensor. They are the same two numbers, and that is the content of writing the field this way.
    Both survive the boost — the picture on the right is <b>F′ = Λ F Λᵀ</b>, and the invariants under
    it are unchanged.${anti ? '' :
    ' <b>Not here, though</b>: E·B = −F<sub>μν</sub>F̃<sup>μν</sup>/4 is an identity about <i>antisymmetric</i> ' +
    'arrays, so on this one the two definitions come apart. That disagreement is not a second fault — ' +
    'it is the same fault seen from a second direction, and it is why the identity is worth checking ' +
    'rather than assuming.'}</p>
  </div>`;
}
