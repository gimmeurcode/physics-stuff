/* ============================================================================
   6gb · PROOF, LOGIC & SETS — the three proof shapes   (Programme C wing C1)

     pfInduct   base case + step, drawn as dominoes, against verification
     pfDescent  what a search for a rational CAN and cannot show, and the
                descent that settles it
     pfEuclid   infinitely many primes — and the misstatement of the proof,
                factored rather than merely warned about

   Each stage prints two verdicts side by side and they are not the same kind
   of thing: what CHECKING has established, and what the ARGUMENT establishes.
   The gap between those two columns is the wing.
   ============================================================================ */

/* ---- 1 · induction -------------------------------------------------------- */
STAGES.pfInduct = {
  title:'The dominoes, and what each one needs',
  enter(st, o){
    st.claim = o.claim || 'sumOdd';
    st.top = o.top === undefined ? 14 : o.top;
  },
  cur(st){
    const C = PF_CLAIMS[st.claim];
    const top = Math.max(C.from + 1, Math.min(C.maxN === undefined ? 40 : C.maxN, Math.round(st.top)));
    const I = pfInductCheck(st.claim, top);
    return { C, top, I, base:C.from };
  },
  controls(){
    const st = ST, N = this.cur(st), C = N.C;
    const maxTop = C.maxN === undefined ? 40 : C.maxN;
    return ctSeg('pfInK', st.claim, Object.keys(PF_CLAIMS).map(k => [k, PF_CLAIMS[k].ex])) +
      ctlRow('check up to n =', ctlSlider('pfInT', C.from + 1, maxTop, 1, Math.min(st.top, maxTop))) +
      `<p class="help"><b>${C.name}</b></p>
      <p class="help">Each domino is one value of n: <b>upright</b> where the statement holds there,
      <b>fallen</b> where it fails. The links between them are the inductive step — a link is drawn
      when P(n) ⇒ P(n+1) has been checked at that n, and broken where it has not. The base case is
      the hand that pushes.</p>
      <p class="help">Two verdicts are printed, and the whole subject is in the difference. Checking
      values tells you about the values you checked. A base case and an unbroken chain of links tells
      you about <i>every</i> n at once — and the claims in this picker include one whose links are all
      sound and whose base fails, and two that are checked correct for dozens of values and are false.</p>`;
  },
  wire(){
    ctWireSeg('pfInK', v => {
      ST.claim = v;
      const C = PF_CLAIMS[v], mx = C.maxN === undefined ? 40 : C.maxN;
      ST.top = Math.max(C.from + 1, Math.min(mx, ST.top));
    });
    wireSlider('pfInT', () => ST.top, v => { ST.top = Math.round(v); }, v => 'n ≤ ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), I = N.I, C = N.C;
    const z = ctChipZone(ctx);
    const top = Math.max(44, z.h + 16);
    const B = ctFitBox(30, top, W - 60, H - top - 46);
    const rows = I.rows;
    const m = rows.length;
    const slot = B.pw / m;
    const dw = Math.max(3, Math.min(18, slot * 0.42));
    /* fill the frame rather than sitting in the middle of it: the dominoes are
       the whole picture, and at the old 84 px cap two thirds of the canvas was
       empty on a standard window. The cap is still there because a very tall
       canvas should not draw a domino the size of a door. */
    const dh = Math.max(40, Math.min(B.ph * 0.62, 150));
    const baseY = B.py + B.ph * 0.80;
    rows.forEach((R, i) => {
      const cx = B.px + (i + 0.5) * slot;
      const col = R.ok ? TH.pos : TH.neg;
      ctx.save();
      ctx.translate(cx, baseY);
      /* a failed value is drawn fallen — the picture says which n broke it
         without the reader having to find the number in a panel */
      if(!R.ok) ctx.rotate(Math.PI / 2.6);
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (R.ok ? 0.85 : 0.6) + ')';
      ctx.fillRect(-dw / 2, -dh, dw, dh);
      ctx.restore();
      if(slot >= 16 || i === 0 || i === m - 1 || R.n % 5 === 0)
        ctText(ctx, cx, baseY + 15, String(R.n), rgbCss(TH.dim), '10px ' + FONT_UI, 'center', 'alphabetic');
    });
    /* the links: the inductive step, drawn where it has been checked */
    for(let i = 0; i + 1 < m; i++){
      const n = rows[i].n;
      const broken = I.stepFail !== null && n >= I.stepFail;
      const noStep = C.kind === 'pattern';
      const x0 = B.px + (i + 0.5) * slot + dw / 2, x1 = B.px + (i + 1.5) * slot - dw / 2;
      const y = baseY - dh - 9;
      ctx.strokeStyle = noStep || broken
        ? 'rgba(' + TH.neg[0] + ',' + TH.neg[1] + ',' + TH.neg[2] + ',0.85)'
        : 'rgba(' + TH.mid[0] + ',' + TH.mid[1] + ',' + TH.mid[2] + ',0.75)';
      ctx.lineWidth = 1.6;
      if(noStep || broken) ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.setLineDash([]);
    }
    /* the base case */
    const bx = B.px + 0.5 * slot;
    ctx.strokeStyle = rgbCss(I.baseOK ? TH.pos : TH.neg); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, baseY - dh - 26, 8, 0, 6.2832); ctx.stroke();
    ctText(ctx, bx, baseY - dh - 40, I.baseOK ? 'base holds' : 'BASE FAILS',
           rgbCss(I.baseOK ? TH.pos : TH.neg), '600 11px ' + FONT_UI, 'center', 'alphabetic');
    ctText(ctx, B.px, B.py + 4, C.ex, rgbCss(TH.text), '600 13px ' + FONT_UI, 'left', 'alphabetic');
    stageNote(ctx, I.verdict + '   ·   ' +
      (I.allHold ? 'and it holds at every n checked' : 'first failure at n = ' + I.firstFail), W, H);
  },
  derive(st){
    const N = this.cur(st), I = N.I, C = N.C;
    const stepLine = C.kind === 'pattern'
      ? 'there is none — nothing links n to n+1'
      : (I.stepAllOK ? 'checked at every n in range and it holds' : 'it first fails at n = ' + I.stepFail);
    return {
      title:'What each of the two columns is entitled to say',
      steps:[
        drvSay('the principle, stated exactly',
          'If P(' + C.from + ') holds, and if P(n) ⇒ P(n+1) for every n ≥ ' + C.from + ', then P(n) holds for every n ≥ ' + C.from + '. It is not an observation about dominoes; it is an axiom of the natural numbers, equivalent to the statement that every non-empty set of them has a least member.'),
        drvStep('the base case',
          `${dv('P')}(${C.from})`,
          I.baseOK ? 'holds — ' + C.ex.replace(/\s+/g, ' ') + ' at n = ' + C.from
                   : 'FAILS at n = ' + C.from + ', so nothing below can be used'),
        drvStep('the inductive step',
          `${dv('P')}(${dv('n')}) ${dop('⟹')} ${dv('P')}(${dv('n')}${dop('+')}1)`,
          C.step),
        drvStep('and whether that step survives being checked',
          `${dop('for all')} ${dv('n')} ${dop('in')} [${C.from}, ${N.top}]`,
          stepLine),
        drvSay('the certificate, and what it covers',
          I.certified
            ? 'Base case and step both hold, so the statement is proved for every n ≥ ' + C.from + ' — including the ones no computer will reach. That is the entire value of the method: two finite checks, infinitely many conclusions.'
            : 'There is no certificate here, and the panel says so rather than reporting the values it happened to check. ' + I.verdict + '.'),
        drvStep('what verification alone found',
          `${dv('P')}(${dv('n')}) ${dop('for')} ${dv('n')} ${dop('=')} ${C.from} ${dop('…')} ${N.top}`,
          I.allHold ? 'true at all ' + I.rows.length + ' values checked'
                    : 'false first at n = ' + I.firstFail),
        drvSay('the principle is not obvious, and it is equivalent to something that is',
          'Induction looks like a rule of thumb about dominoes and is in fact an axiom of ℕ — equivalent to well-ordering, the statement that every non-empty set of positive integers has a least member. The two imply each other: if P failed somewhere, the failures would have a least one, and it could not be the base, so its predecessor satisfies P and the step is violated there. The descent argument for √2 in the next stage uses well-ordering directly, which is why it feels like a different method and is not.'),
        drvSay('and the variants are the same axiom wearing other clothes',
          '<b>Strong</b> induction assumes P at every value below n rather than only at n−1, which is what a proof about factorisations needs, since the factors of n are not n−1. <b>Structural</b> induction runs over formulas rather than numbers — and it is what justifies every recursive function in the engine behind this wing, including the parser that read the formula in the stage next door. Neither is a new principle; both are this one applied to a different well-ordered set.'),
        drvSay('and why those two columns are not the same column',
          C.kind === 'pattern'
            ? 'This claim is checked true for a long stretch and is false. Verification never had the authority to conclude anything about the values it did not reach, and here that gap is where the counterexample lives.'
            : (I.baseOK ? 'They agree here, and the agreement is not a coincidence: the certificate implies the checks, so a certified claim that failed a check would mean an error in one of them.'
                        : 'The step is sound at every n and the claim is false at every n. The dominoes are correctly spaced and nobody pushed the first one — which is exactly what a missing base case does, and why it is never a formality.'))
      ],
      note:C.kind === 'identity'
        ? 'The residual on the identity is printed in the panel with its own scale, because a difference means nothing without one — and for the integer claims it is exactly zero rather than small.'
        : 'A step of the form P(n) ⇒ P(n+1) needs its own side conditions, and this claim’s are stated in the rung above.'
    };
  },
  readout(st){
    const N = this.cur(st), I = N.I, C = N.C;
    const last = I.rows[I.rows.length - 1];
    const isId = C.kind === 'identity';
    return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
      ${kv('base case, at n = ' + C.from,
           I.baseOK ? '<span style="color:var(--c-pos)">holds</span>'
                    : '<span style="color:var(--c-neg)">fails</span>')}
      ${kv('inductive step',
           C.kind === 'pattern' ? '<span style="color:var(--c-neg)">there is none</span>'
           : (I.stepAllOK ? '<span style="color:var(--c-pos)">holds at every n checked</span>'
                          : '<span style="color:var(--c-neg)">first fails at n = ' + I.stepFail + '</span>'))}
      ${kv('what the argument proves',
           I.certified ? '<span style="color:var(--c-pos)">every n ≥ ' + C.from + '</span>'
                       : '<span style="color:var(--c-neg)">nothing — ' + I.verdict + '</span>')}
      ${kv('what checking found', I.allHold
           ? 'true at all ' + I.rows.length + ' values from ' + C.from + ' to ' + N.top
           : '<span style="color:var(--c-neg)">false first at n = ' + I.firstFail + '</span>')}
    </div>
    <div class="card tight"><div class="ttl">At n = ${last.n}</div>
      ${isId ? kv('the sum, added up one term at a time', fmtSig(last.lhs, 12)) : ''}
      ${isId ? kv('the closed form', fmtSig(last.rhs, 12)) : ''}
      ${/* Two sides of a TRUE identity are two routes to one number and their
            difference is a residual that ought to vanish — fmtAgree is exactly
            right for that. Two sides of a claim declared FALSE are not two
            routes to anything, and calling their gap an agreement invites the
            reader (and auditsides, which flagged it on 2026-08-19) to read a
            deliberate counterexample as a defect in the arithmetic. */
        isId ? (C.trueClaim
          ? kv('the two, compared', fmtAgree(last.lhs, last.rhs))
          : kv('how far apart the two sides are',
               fmtSig(last.rhs - last.lhs, 6) + ' at n = ' + last.n +
               ' — <b>this is the claim being false</b>, not an error in the arithmetic. ' +
               'The gap is the same at every n, which is exactly why the inductive step survives it.'))
        : ''}
      ${isId ? '' : kv('the statement there', last.ok ? 'holds' : 'fails')}
      ${C.kind === 'inequality' ? kv('the two sides', fmtSig(last.lhs, 10) + '  vs  ' + fmtSig(last.rhs, 10)) : ''}
      ${C.kind === 'divisibility' ? kv('the remainder', String(last.lhs) + ' — and 0 is what divisibility means') : ''}
      ${C.kind === 'pattern' ? kv('the value there', fmtSig(last.lhs, 12) + (last.ok ? ' — prime' : ' — composite, and the pattern is over')) : ''}
      ${isId && I.stepResid !== undefined ? kv('worst step residual, relative',
           I.stepResid === 0 ? 'exactly zero — the step is an identity in whole numbers'
                             : fmtSig(I.stepResid, 3) + ' — round-off, on the one claim whose sides are not integers') : ''}
      <p class="help">${C.why}</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st), I = N.I;
    return `<div class="k">${I.baseOK ? 'base ✓' : 'base ✗'} · ${I.stepAllOK && N.C.kind !== 'pattern' ? 'step ✓' : 'step ✗'}</div>
      <div style="color:${I.certified ? 'var(--c-pos)' : 'var(--c-neg)'}">${I.certified ? 'proved for all n' : 'not proved'}</div>
      <div style="color:var(--c-dim)">${I.allHold ? 'checks pass to ' + N.top : 'fails at ' + I.firstFail}</div>`;
  },
  legend(){
    return [[rgbCss(TH.pos), 'the statement holds at this n'],
            [rgbCss(TH.neg), 'it fails here'],
            [rgbCss(TH.mid), 'the step has been checked between these two'],
            [rgbCss(TH.neg), 'no step, or a broken one — the chain stops']];
  },
  dockLegend:true
};

/* ---- 2 · what a search can show, and the descent that finishes it --------- */
const PF_NUM_SLOT = [{ k:'x', label:'the number', def:'sqrt(5)',
                       vars:'any constant the engine can evaluate — sqrt(7), pi/2, 1.7320508',
                       audit:'sqrt(7)',
                       build:s => { const v = mathNum(s);
                                    if(!Number.isFinite(v)) throw new Error('that is not a number I can evaluate');
                                    if(v <= 0 || v > 1000) throw new Error('keep it between 0 and 1000, where the search is meaningful');
                                    return { v, f:() => v }; } }];

STAGES.pfDescent = {
  title:'No rational equals √2 — and what a search can say about it',
  enter(st, o){
    st.target = o.target || 'root2';
    st.Q = o.Q === undefined ? 200 : o.Q;
    st.showDescent = o.showDescent === undefined ? false : !!o.showDescent;
  },
  cur(st){
    let x, name, why = '', T = null, ok = true, badWhy = '';
    if(st.target === 'custom'){
      const own = pkOwn(st, 'pfDs', PF_NUM_SLOT);
      const v = mathNum(own.x);
      ok = Number.isFinite(v) && v > 0 && v <= 1000;
      badWhy = ok ? '' : 'that is not a number the search can use';
      x = ok ? v : Math.SQRT2;
      name = 'your number, ' + fmtSig(x, 9);
    } else {
      T = PF_TARGETS[st.target]; x = T.v; name = T.name; why = T.why;
    }
    const Q = Math.max(10, Math.min(PF_SEARCH_MAX, Math.round(st.Q)));
    const curve = pfApproxCurve(x, Q);
    const best = pfBestRat(x, Q);
    const measured = pfLiminfMeasured(x, Q, 20);
    /* A DECLARED LIMIT HAS A DOMAIN IN WHICH IT CAN BE CHECKED, and pretending
       otherwise turned a correct table into a failing gate on 2026-08-19. A
       positive floor is reached by the record-holders and can be compared. A
       limit of zero can only be confirmed where the search actually reaches an
       exact hit — 3/2 does at q = 2; e never will, because its limit is
       approached through denominators no finite search here gets to, and the
       rational impostor's denominator is two million. So the third state is
       "not checkable at this range", and it is reported rather than passed. */
    const reach = !T || T.liminf === null ? 'none'
                : (T.liminf > 0 ? 'floor'
                : (curve.exact ? 'zeroReached' : 'zeroOutOfReach'));
    const claimOK = reach === 'floor'
        ? (measured !== null && Math.abs(measured - T.liminf) < 0.02 * T.liminf)
      : reach === 'zeroReached' ? curve.bestErr === 0
      : null;   /* null means the search cannot speak to it, not that it passed */
    return { x, name, why, T, ok, badWhy, Q, curve, best, measured, reach, claimOK };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return pkSeg('pfDsK', PF_TARGETS, st.target, e => e.name) +
      pkBoxes('pfDs', st.target, st, PF_NUM_SLOT, null,
              'Any constant: <b>sqrt(7)</b>, <b>pi/2</b>, <b>2^(1/3)</b>, or a decimal you invent. ' +
              'The search treats them all alike, which is the point being made.') +
      ctlRow('search every denominator up to', ctlSlider('pfDsQ', 10, 2000, 10, st.Q)) +
      `<div class="row wrap">${ctChk('pfDsD', 'show the descent for √2', st.showDescent)}</div>
      ${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.badWhy)} — the search keeps the last number that read.</p>`}
      <p class="help">Each dot is one denominator q: how far the best fraction with that denominator
      falls from the target, <b>multiplied by q²</b>. That scaling is the whole trick — without it
      every curve falls to zero and says nothing, because <i>every</i> real is approximated as closely
      as you like. With it, an irrational settles onto a positive floor and a rational reaches zero.</p>
      <p class="help"><b>And a search still proves nothing.</b> One of the presets is a ratio of
      integers chosen to look exactly like √2 over any range you can search. Only the parity
      argument — the descent — separates them, and that argument is in the ladder below.</p>`;
  },
  wire(){
    pkWire('pfDsK', 'pfDs', ST.target, ST, PF_NUM_SLOT, null, v => { ST.target = v; });
    wireSlider('pfDsQ', () => ST.Q, v => { ST.Q = Math.round(v); }, v => 'q ≤ ' + Math.round(v));
    ctWireChk('pfDsD', v => { ST.showDescent = v; });
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), C = N.curve;
    const z = ctChipZone(ctx);
    const top = Math.max(40, z.h + 12);
    const chainH = st.showDescent ? 54 : 0;
    /* The left margin is 66 rather than 30 because plotFrame puts the rotated
       y-title clear of the tick numbers *if there is room*, and clamps it to
       x = 12 when there is not — so at px = 30 the title printed straight
       through its own tick labels and "0.8" read as "8.8". Screenshot-only:
       auditticks reads duplicate ticks and headings under the chip, and two
       labels crossing is neither. */
    const B = ctFitBox(66, top, W - 96, H - top - 46 - chainH);
    const hi = Math.max(0.75, Math.min(1.4, C.pts.slice(0, 8).reduce((m, p) => Math.max(m, p.scaled), 0)));
    const P = mkPlot(B.px, B.py, B.pw, B.ph, 0, N.Q, 0, hi);
    plotFrame(ctx, P, 'denominator q', 'q² × |x − p/q|', '');
    ctGrid(ctx, P);
    /* The cloud is subsampled — 2000 dots is 2000 rasterising calls per frame
       and the frame budget does not allow it. Nothing is hidden by that: the
       record-holders below are computed over EVERY q and every one is drawn,
       so the minimum is always on the canvas whether or not its neighbours are. */
    const stride = Math.max(1, Math.ceil(C.pts.length / 320));
    ctx.fillStyle = 'rgba(' + TH.dim[0] + ',' + TH.dim[1] + ',' + TH.dim[2] + ',0.42)';
    for(let i = 0; i < C.pts.length; i += stride){
      const p = C.pts[i];
      if(p.scaled > hi) continue;
      ctx.fillRect(P.X(p.q) - 1, P.Y(p.scaled) - 1, 2, 2);
    }
    /* the record-holders, which are the continued fraction's convergents */
    C.records.forEach(r => {
      if(r.scaled > hi) return;
      ctDot(ctx, P, r.q, r.scaled, 3.4, rgbCss(TH.accent));
    });
    if(C.records.length > 1)
      ctPath(ctx, P, C.records.filter(r => r.scaled <= hi).map(r => ({ x:r.q, y:r.scaled })),
             'rgba(' + TH.accent[0] + ',' + TH.accent[1] + ',' + TH.accent[2] + ',0.5)', 1.2, [4, 3]);
    /* the declared floor, where one is declared */
    if(N.T && N.T.liminf > 0){
      ctPath(ctx, P, [{ x:0, y:N.T.liminf }, { x:N.Q, y:N.T.liminf }], rgbCss(TH.pos), 1.6, [6, 4]);
      ctText(ctx, P.px + P.pw - 6, P.Y(N.T.liminf) - 6, 'the floor: ' + fmtSig(N.T.liminf, 4),
             rgbCss(TH.pos), '11px ' + FONT_UI, 'right', 'alphabetic');
    }
    if(C.exact){
      ctDot(ctx, P, C.exact.q, 0, 5, rgbCss(TH.neg));
      ctText(ctx, P.X(C.exact.q) + 8, P.Y(0) - 8,
             'exact at ' + C.exact.p + '/' + C.exact.q, rgbCss(TH.neg),
             '600 11px ' + FONT_UI, 'left', 'alphabetic');
    }
    if(st.showDescent){
      const D = pfDescent(17, 12, 8);
      /* measured from the CANVAS FLOOR, not from the plot: plotFrame writes the
         x-axis label 18 px under the box and stageNote writes at H − 8, so a
         band placed relative to the plot lands on one or the other. */
      const y = H - 26, lab = H - 42;
      ctText(ctx, B.px, lab, 'if p² = 2q² had a solution, this map makes a smaller one — for ever:',
             rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
      let x = B.px;
      ctx.font = '600 12px ' + FONT_UI;
      D.chain.forEach((r, i) => {
        const s = r.p + '/' + r.q;
        ctText(ctx, x, y, s, rgbCss(i === D.chain.length - 1 ? TH.neg : TH.text),
               '600 12px ' + FONT_UI, 'left', 'alphabetic');
        /* advance by what was actually drawn — a fixed stride hid the arrow
           behind "17/12", which is wider than any of the later pairs */
        x += ctx.measureText(s).width + 6;
        if(i < D.chain.length - 1){
          ctText(ctx, x, y, '→', rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
          x += 14;
        }
      });
      ctText(ctx, x + 10, y, '— and p² − 2q² never changed: ' + D.chain[0].resid,
             rgbCss(TH.dim), '11px ' + FONT_UI, 'left', 'alphabetic');
    }
    stageNote(ctx, 'best with q ≤ ' + N.Q + ': ' + N.best.A.p + '/' + N.best.A.q +
              '   ·   ' + (C.exact ? 'an exact hit exists — the number is rational'
                                   : 'no exact hit, and the scaled error never approached zero'), W, H);
  },
  derive(st){
    const N = this.cur(st), C = N.curve;
    return {
      title:'Why the search cannot finish the job, and what does',
      steps:[
        drvSay('every real number is approximated arbitrarily well by rationals',
          'So "I searched and found nothing exact" is not evidence of anything. Dirichlet’s theorem sharpens the obvious version: for every q there is a p with |x − p/q| < 1/q², so the errors must fall at least that fast whatever x is. The only question left is whether they fall FASTER.'),
        drvStep('so scale the error by q² and look at what remains',
          `${dv('q')}${uniSup('^2')}|${dv('x')} ${dop('−')} ${dfrac(dv('p'), dv('q'))}|`,
          'over q ≤ ' + N.Q + ' the smallest value reached is ' + fmtSig(C.minScaled, 4) +
          (C.exact ? ', and one q hits zero exactly' : ', and nothing came near zero')),
        drvStep('for √2 that floor is forced by an integer being at least 1',
          `|${dv('x')} ${dop('−')} ${dfrac(dv('p'), dv('q'))}| ${dop('=')} ${dfrac('|' + dv('p') + uniSup('^2') + ' − 2' + dv('q') + uniSup('^2') + '|', dv('q') + uniSup('^2') + '(√2 + p/q)')} ${dop('≥')} ${dfrac('1', dv('q') + uniSup('^2') + '(√2 + p/q)')}`,
          'because p² − 2q² is a whole number and cannot be zero — which is the theorem, not the search'),
        drvSay('and that "cannot be zero" is the only thing worth proving here',
          'Suppose p² = 2q² with p and q whole and positive. Then p² is even, so p is even, so p² is divisible by 4, so 2q² is divisible by 4, so q² is even, so q is even. Both were even — so the fraction was not in lowest terms, and no fraction can be reduced for ever.'),
        drvStep('the same argument as a machine you can run: descent',
          `(${dv('p')}, ${dv('q')}) ${dop('⟼')} (2${dv('q')} ${dop('−')} ${dv('p')}, ${dv('p')} ${dop('−')} ${dv('q')})`,
          (function(){ const D = pfDescent(17, 12, 8);
            return D.chain.map(r => r.p + '/' + r.q).join(' → ') +
                   ' — strictly decreasing, and p² − 2q² stays ' + D.chain[0].resid; })()),
        drvSay('which is why it stops at 1 and not at 0',
          'The map preserves p² − 2q² exactly. Starting from a genuine solution that quantity is 0 and stays 0, so the descent would run for ever through positive whole numbers — impossible. Starting from 17/12 it is 1, and the chain runs down to 1/1 and halts. The convergents of √2 are exactly this ladder read upwards.'),
        drvStep('what the panel is entitled to conclude',
          `${dop('search:')} ${dop('no exact hit for')} ${dv('q')} ${dop('≤')} ${N.Q}`,
          C.exact ? 'here there IS one, so this number is rational and the descent does not apply'
                  : 'nothing — and the descent above proves it anyway, for √2 and for every non-square integer')
      ],
      note:'One preset is a ratio of integers whose denominator is two million. Every number the search prints for it looks irrational, and the search is simply not the kind of instrument that could tell.'
    };
  },
  readout(st){
    const N = this.cur(st), C = N.curve, T = N.T;
    return `<div class="card tight"><div class="ttl">${esc(N.name)}</div>
      ${kv('the value used', fmtSig(N.x, 12))}
      ${kv('best fraction with q ≤ ' + N.Q, N.best.A.p + '/' + N.best.A.q +
           '  — error ' + fmtSig(N.best.A.err, 4))}
      ${kv('found a second way', N.best.B.p + '/' + N.best.B.q + ' by continued fractions')}
      ${kv('the two searches', N.best.errAgree
           ? '<span style="color:var(--c-pos)">agree — brute force and the theory found the same fraction</span>'
           : '<span style="color:var(--c-neg)">disagree, which would be a defect</span>')}
      ${kv('an exact hit?', C.exact
           ? '<span style="color:var(--c-neg)">yes, at ' + C.exact.p + '/' + C.exact.q + ' — the number is rational</span>'
           : 'none for any q ≤ ' + N.Q)}
    </div>
    <div class="card tight"><div class="ttl">The scaled error, q²|x − p/q|</div>
      ${kv('smallest value anywhere in the search', fmtSig(C.minScaled, 5))}
      ${kv('smallest along the record-holders past q = 20',
           N.measured === null ? 'the search has not reached far enough yet' : fmtSig(N.measured, 6))}
      ${T ? kv('what this number’s limit is', T.limWhy || (T.liminf === null ? 'not known' : fmtSig(T.liminf, 6))) : ''}
      ${N.reach === 'floor' ? kv('declared limit against the measurement',
           N.measured === null ? 'raise q — the records have not settled yet'
           : fmtAgree(N.measured, T.liminf)) : ''}
      ${N.reach === 'zeroReached' ? kv('declared limit against the measurement',
           'zero, and the search reached it exactly at ' + N.curve.exact.p + '/' + N.curve.exact.q) : ''}
      ${N.reach === 'zeroOutOfReach' ? kv('declared limit against the measurement',
           'the limit is zero and <b>this search cannot confirm it</b> — the denominators that would ' +
           'show it lie past q = ' + N.Q + ', so the honest reading here is "still falling", not "reached"') : ''}
      ${kv('record-holders found', C.records.length + ' — these are the continued-fraction convergents')}
      <p class="help">The smallest value <b>anywhere</b> is not the limit: for √2 it is 0.3431, at 3/2,
      which sits below the 0.35355 the tail settles on. A limit is about the tail, and reading the
      global minimum as the limit is the mistake this row exists to prevent.</p>
    </div>
    ${N.why ? `<div class="card tight"><div class="ttl">About this number</div><p class="help">${N.why}</p></div>` : ''}`;
  },
  chip(st){
    const N = this.cur(st), C = N.curve;
    return `<div class="k">${esc(N.name)}</div>
      <div style="color:var(--c-pos)">${N.best.A.p}/${N.best.A.q}</div>
      <div style="color:var(--c-dim)">${C.exact ? 'exact hit — rational' : 'floor ' + fmtSig(C.minScaled, 3)}</div>`;
  },
  legend(){
    return [[rgbCss(TH.dim), 'one denominator q'],
            [rgbCss(TH.accent), 'a record — the best so far'],
            [rgbCss(TH.pos), 'the floor this number cannot go below'],
            [rgbCss(TH.neg), 'an exact hit, which only a rational has']];
  },
  dockLegend:true
};

/* ---- 3 · Euclid ----------------------------------------------------------- */
function pfParseList(src){
  const parts = String(src).split(/[,\s]+/).filter(t => t.length);
  if(!parts.length) return { ok:false, list:[], why:'give me a list of primes, like 2, 3, 5' };
  const out = [];
  for(const t of parts){
    const v = Number(t);
    if(!Number.isInteger(v) || v < 2) return { ok:false, list:[], why:'“' + t + '” is not a whole number above 1' };
    if(!pfIsPrime(v)) return { ok:false, list:[], why:v + ' is not prime — the argument needs a list of primes' };
    if(out.indexOf(v) >= 0) return { ok:false, list:[], why:v + ' appears twice, and the list is a set here' };
    out.push(v);
  }
  let prod = 1;
  for(const v of out) prod *= v;
  if(prod + 1 > Number.MAX_SAFE_INTEGER)
    return { ok:false, list:[], why:'the product passes 2⁵³, where whole numbers stop being exact — a smaller list, please' };
  return { ok:true, list:out, why:'' };
}
const PF_LIST_SLOT = [{ k:'ps', label:'your primes', def:'2, 5, 11',
                        vars:'any list of distinct primes, separated by commas',
                        audit:'3, 7, 13',
                        build:s => { const P = pfParseList(s); if(!P.ok) throw new Error(P.why);
                                     return { list:P.list, f:() => 0 }; } }];
const PF_LISTS_PRESET = {
  firstk:  { name:'the first k primes', why:'The list Euclid’s argument is usually stated with, and the one that produces the famous 30031.' },
  mullin:  { name:'the Euclid–Mullin chain', why:'Feed the smallest new prime back in and repeat. 2, 3, 7, 43, 139, 50207 — and then the numbers pass what exact arithmetic can factor here, which the panel says rather than guessing.' },
  odds:    { name:'primes that are not 2', why:'A list that misses a prime on purpose. The construction still works: ∏+1 is even, so 2 turns up as the new prime, and the theorem never claimed the new prime would be large.' }
};

STAGES.pfEuclid = {
  title:'No list of primes is all of them',
  enter(st, o){
    st.which = o.which || 'firstk';
    st.k = o.k === undefined ? 4 : o.k;
  },
  cur(st){
    const k = Math.max(1, Math.min(8, Math.round(st.k)));
    let list, name, why = '', ok = true, badWhy = '';
    if(st.which === 'custom'){
      const own = pkOwn(st, 'pfEu', PF_LIST_SLOT);
      const P = pfParseList(own.ps);
      ok = P.ok; badWhy = P.why;
      list = P.ok ? P.list : [2, 5, 11];
      name = 'your list';
    } else if(st.which === 'mullin'){
      list = pfEuclidChain(2, k).primes.slice(0, k);
      name = PF_LISTS_PRESET.mullin.name; why = PF_LISTS_PRESET.mullin.why;
    } else if(st.which === 'odds'){
      list = pfPrimesUpTo(60).filter(p => p !== 2).slice(0, k);
      name = PF_LISTS_PRESET.odds.name; why = PF_LISTS_PRESET.odds.why;
    } else {
      list = pfPrimesUpTo(60).slice(0, k);
      name = PF_LISTS_PRESET.firstk.name; why = PF_LISTS_PRESET.firstk.why;
    }
    const S = pfEuclidStep(list);
    return { k, list, name, why, ok, badWhy, S };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return pkSeg('pfEuK', PF_LISTS_PRESET, st.which, e => e.name) +
      pkBoxes('pfEu', st.which, st, PF_LIST_SLOT, null,
              'Distinct primes, separated by commas — <b>2, 5, 11</b> or <b>3, 7, 13</b>. ' +
              'The product must stay under 2⁵³, so eight or nine small ones is the limit of exact arithmetic here.') +
      (st.which === 'custom' ? '' : ctlRow('how many primes in the list', ctlSlider('pfEuN', 1, 8, 1, st.k))) +
      `${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.badWhy)} — the construction keeps the last list that read.</p>`}
      <p class="help">Take any finite list of primes, multiply them, add one. The result leaves
      remainder <b>1</b> when divided by every prime on the list — so none of them divides it — and
      therefore every prime factor it has is new. The list was not all of them, and the list was
      arbitrary.</p>
      <p class="help"><b>The proof does not say ∏+1 is prime, and a great many books do.</b> Set the
      list to the first six primes and read the factorisation: 30031 = 59 × 509. Both factors are new,
      the theorem is untouched, and the misstatement is dead.</p>`;
  },
  wire(){
    pkWire('pfEuK', 'pfEu', ST.which, ST, PF_LIST_SLOT, null, v => { ST.which = v; });
    wireSlider('pfEuN', () => ST.k, v => { ST.k = Math.round(v); }, v => 'k = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), S = N.S;
    const z = ctChipZone(ctx);
    const top = Math.max(44, z.h + 16);
    const B = ctFitBox(30, top, W - 60, H - top - 44);
    const rowY = [B.py + 26, B.py + B.ph * 0.44, B.py + B.ph * 0.78];
    const box = (x, y, w, h, label, col, sub) => {
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.18)';
      ctx.fillRect(x, y - h / 2, w, h);
      ctx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.8)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y - h / 2, w, h);
      ctText(ctx, x + w / 2, y, label, rgbCss(col), '600 12px ' + FONT_UI, 'center', 'middle');
      if(sub) ctText(ctx, x + w / 2, y + h / 2 + 12, sub, rgbCss(TH.faint), '10px ' + FONT_UI, 'center', 'alphabetic');
    };
    /* row 1: the list */
    ctText(ctx, B.px, rowY[0] - 24, 'any finite list of primes', rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
    const bw = Math.min(52, (B.pw - 20) / Math.max(1, N.list.length) - 8);
    N.list.forEach((p, i) => box(B.px + i * (bw + 8), rowY[0], bw, 26, String(p), TH.dim,
                                 'N mod ' + p + ' = ' + S.rems[i].r));
    /* row 2: the product plus one */
    ctText(ctx, B.px, rowY[1] - 26, 'multiply them all, add one', rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
    box(B.px, rowY[1], Math.min(260, B.pw * 0.6), 30,
        'N = ' + fmtSig(S.prod, 15) + ' + 1 = ' + fmtSig(S.N, 15), TH.accent);
    /* row 3: the factors */
    ctText(ctx, B.px, rowY[2] - 26,
           S.ok ? (S.isPrime ? 'and this time N is itself prime — which the theorem never promised'
                             : 'factor it: every factor is new')
                : 'past exact arithmetic — ' + S.why,
           rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
    if(S.ok){
      const fw = Math.min(90, (B.pw - 20) / Math.max(1, S.factors.length) - 8);
      S.factors.forEach((f, i) => {
        const isNew = N.list.indexOf(f) < 0;
        box(B.px + i * (fw + 8), rowY[2], fw, 26, String(f), isNew ? TH.pos : TH.neg,
            isNew ? 'new' : 'ON THE LIST');
      });
    }
    stageNote(ctx, S.noneDivides
      ? 'every listed prime leaves remainder 1 — so none of them divides N'
      : 'a listed prime divides N, which cannot happen', W, H);
  },
  derive(st){
    const N = this.cur(st), S = N.S;
    return {
      title:'The proof, and the sentence that is not part of it',
      steps:[
        drvSay('the shape of the argument',
          'Not "there are infinitely many primes" proved directly — that is hard to even start. Instead: assume you have a finite list, and produce a prime that is not on it. Since the list was arbitrary, no finite list can be complete. This is proof by contradiction used at its most economical.'),
        drvStep('build N from the list',
          `${dv('N')} ${dop('=')} ${dv('p')}₁${dv('p')}₂${dop('⋯')}${dv('p')}ₖ ${dop('+')} 1`,
          'N = ' + fmtSig(S.N, 15) + ' from ' + N.list.join(' × ')),
        drvStep('every listed prime leaves remainder 1',
          `${dv('N')} ${dop('mod')} ${dv('p')}ᵢ ${dop('=')} 1 ${dop('for every')} ${dv('i')}`,
          S.rems.map(r => 'mod ' + r.p + ' → ' + r.r).join(',  ')),
        drvSay('so no listed prime divides N',
          'A prime dividing both N and the product would divide their difference, which is 1 — and no prime divides 1. That single line is the whole mechanism, and it is why the +1 is there.'),
        drvStep('N has a prime factor, and it is not on the list',
          `${dv('N')} ${dop('=')} ${S.ok ? S.factors.join(' × ') : '…'}`,
          S.ok ? (S.newPrimes.length + ' new prime' + (S.newPrimes.length === 1 ? '' : 's') + ': ' + S.newPrimes.join(', '))
               : 'the factorisation stopped: ' + S.why),
        drvSay('the misstatement, and why it is worth naming',
          'Many books write "so ∏+1 is prime". It is not a step in the argument and it is not true: 2·3·5·7·11·13 + 1 = 30031 = 59 × 509. The theorem survives untouched because it only ever needed a NEW PRIME FACTOR, not a prime N — and the difference between those two statements is exactly the kind of thing reading a proof carefully is for.'),
        drvStep('the same conclusion by a route that never factors anything',
          `${dop('∀')}${dv('p')} ${dop('∈ list:')} ${dv('N')} ${dop('mod')} ${dv('p')} ${dop('≠')} 0`,
          S.noneDivides ? 'holds for all ' + N.list.length + ' of them, so N’s factors are new whatever they are'
                        : 'FAILED, which cannot happen and would mean an arithmetic error')
      ],
      note:'The Euclid–Mullin preset feeds the smallest new prime back into the list. Whether it eventually produces every prime is an open question, which is a fair reminder that a two-line proof does not exhaust its own subject.'
    };
  },
  readout(st){
    const N = this.cur(st), S = N.S;
    return `<div class="card tight"><div class="ttl">${esc(N.name)}</div>
      ${kv('the list', N.list.join(', '))}
      ${kv('their product', fmtSig(S.prod, 15))}
      ${kv('N = product + 1', fmtSig(S.N, 15))}
      ${kv('is N prime?', S.ok ? (S.isPrime ? 'yes — this time' : 'no: ' + S.factors.join(' × '))
                               : 'cannot say — ' + S.why)}
      ${kv('new primes it produced', S.ok ? S.newPrimes.join(', ') || 'none, which cannot happen' : 'not available')}
    </div>
    <div class="card tight"><div class="ttl">The two routes to “no listed prime divides N”</div>
      ${kv('by factoring N and comparing', S.ok
           ? (S.newPrimes.length === S.factors.length
              ? '<span style="color:var(--c-pos)">every factor is new</span>'
              : '<span style="color:var(--c-neg)">a listed prime appears among the factors</span>')
           : 'not available past 2⁵³')}
      ${kv('by remainders, factoring nothing', S.noneDivides
           ? '<span style="color:var(--c-pos)">every remainder is 1</span>'
           : '<span style="color:var(--c-neg)">some remainder is 0</span>')}
      ${kv('the two', S.agree ? '<span style="color:var(--c-pos)">agree</span>'
                              : '<span style="color:var(--c-neg)">disagree, which would be a defect</span>')}
      <p class="help">The remainder route is the one the proof uses, and it needs no factorisation at
      all — which matters, because factoring is hard and the theorem is not. The panel factors anyway,
      to show what N actually is.</p>
    </div>
    <div class="card tight"><div class="ttl">The famous counterexample to the misstatement</div>
      ${(function(){ const M = pfPrimorialPrime(6);
        return kv('2·3·5·7·11·13 + 1', M.N + ' = ' + M.factors.join(' × ') +
                  (M.isPrime ? ' — prime' : ' — <b>not prime</b>')); })()}
      ${(function(){ const M = pfPrimorialPrime(5);
        return kv('and one fewer prime', M.N + (M.isPrime ? ' — prime, which is why the pattern was believed' : ' = ' + M.factors.join(' × '))); })()}
      <p class="help">The first five primorial-plus-ones are prime, and the sixth is not. Five is
      about the number of cases it takes for a pattern to feel like a theorem — the same lesson the
      induction stage makes with n² + n + 41, and the same answer.</p>
    </div>
    ${N.why ? `<div class="card tight"><div class="ttl">About this list</div><p class="help">${N.why}</p></div>` : ''}`;
  },
  chip(st){
    const N = this.cur(st), S = N.S;
    return `<div class="k">N = ${fmtSig(S.N, 12)}</div>
      <div style="color:${S.ok && !S.isPrime ? 'var(--c-warn)' : 'var(--c-pos)'}">${S.ok ? (S.isPrime ? 'prime' : S.factors.join(' × ')) : 'past 2⁵³'}</div>
      <div style="color:var(--c-dim)">${S.noneDivides ? 'no listed prime divides it' : 'check failed'}</div>`;
  },
  legend(){
    return [[rgbCss(TH.dim), 'a prime on the list'],
            [rgbCss(TH.accent), 'N = their product, plus one'],
            [rgbCss(TH.pos), 'a prime factor that is new'],
            [rgbCss(TH.neg), 'one that was already listed — which cannot happen']];
  },
  dockLegend:true
};
