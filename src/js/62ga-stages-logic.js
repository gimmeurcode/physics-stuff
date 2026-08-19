/* ============================================================================
   6ga · PROOF, LOGIC & SETS — the propositional stages   (Programme C wing C1)

     pfTable   two formulas, every assignment, and the row where they part
     pfQuant   a relation drawn as a grid, and the six quantified statements

   Nothing here computes: 19b-logic.js decides everything, twice, and these
   stages draw what it decided. The one design rule worth stating is that the
   VERDICT is never printed alone — the row that produces it is always on the
   canvas, because "not equivalent" is a claim and the row is the evidence.
   ============================================================================ */

/* the reader's own formula. fnWire's build hook is where a typed formula is
   accepted or rejected, so a half-written one leaves the picture alone and
   reports its own complaint with the character position. */
const pfBuild = s => {
  const P = pfParse(s);
  if(!P.ok) throw new Error(P.why);
  return { ast:P.ast, f:() => 0 };
};
/* what a gate types in: valid, and different from every default this wing
   ships, or "did typing change anything" has nothing to compare */
const PF_AUDIT = { a:'(p | q) & ~(p & q)', b:'p ^ q' };
const PF_SLOT = (k, label, def) =>
  ({ k, label, def, vars:'p, q, r … with ¬ ∧ ∨ → ↔, or ~ & | -> <->',
     audit:PF_AUDIT[k] || 'p -> (q -> p)', build:pfBuild });
const PF_SLOTS = [PF_SLOT('a', 'formula A', 'p -> q'), PF_SLOT('b', 'formula B', '~q -> ~p')];

/* true and false get colours, and they are the site's own two — a reader who
   has met the positive/negative pair anywhere else reads this table free */
const pfTF = v => (v ? TH.pos : TH.neg);
const pfTFcss = v => (v ? 'var(--c-pos)' : 'var(--c-neg)');
const pfWord = v => (v ? 'true' : 'false');

/* ---- 1 · the truth table -------------------------------------------------- */
STAGES.pfTable = {
  title:'Two formulas, and every assignment there is',
  enter(st, o){
    st.lawKey = o.lawKey || 'contrapositive';
    st.showClauses = o.showClauses === undefined ? false : !!o.showClauses;
  },
  cur(st){
    let a, b, name, declared = null, why = '', ex = '';
    if(st.lawKey === 'custom'){
      const own = pkOwn(st, 'pfTb', PF_SLOTS);
      a = own.a; b = own.b; name = 'your two formulas';
    } else {
      const L = PF_LAWS[st.lawKey];
      a = L.a; b = L.b; name = L.name; declared = L.equiv; why = L.why; ex = L.ex;
    }
    const E = pfEquiv(a, b);
    return { a, b, name, declared, why, ex, E,
             /* the declared property, recomputed — never read to decide */
             claimOK:declared === null || (E.ok && E.equal === declared) };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return pkSeg('pfTbK', PF_LAWS, st.lawKey, e => e.name.replace(/ — NOT.*$/, '').replace(/^the /, '')) +
      pkBoxes('pfTb', st.lawKey, st, PF_SLOTS, null,
              'Write them as you would on paper. <b>~ &amp; | -&gt; &lt;-&gt;</b> all work, and so do ' +
              '<b>¬ ∧ ∨ → ↔</b>; <b>T</b> and <b>F</b> are the constants, and any word is a variable, ' +
              'so <b>rain -&gt; wet</b> parses. Up to six letters between the two formulas.') +
      `<div class="row wrap">${ctChk('pfTbC', 'show the clause form', st.showClauses)}</div>
      ${N.E.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.E.why)} — the table keeps the last pair that read.</p>`}
      <p class="help"><b>Every row is drawn, so nothing is being taken on trust.</b> Two formulas are
      equivalent when they have the same column, and not equivalent when there is a row where they
      differ — and that row, not the verdict, is the thing to look at. A single row is a complete
      disproof; no number of agreeing rows would be a proof if the table were not finite.</p>
      <p class="help">The panel decides the same question a second way, by clause form, which never
      evaluates the formulas at any assignment at all. The two verdicts are printed side by side.</p>`;
  },
  wire(){
    pkWire('pfTbK', 'pfTb', ST.lawKey, ST, PF_SLOTS, null, v => { ST.lawKey = v; });
    ctWireChk('pfTbC', v => { ST.showClauses = v; });
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), E = N.E;
    const z = ctChipZone(ctx);
    const top = Math.max(38, z.h + 12);
    const B = ctFitBox(24, top, W - 48, H - top - 40);
    if(!E.ok){
      ctText(ctx, B.px + B.pw / 2, B.py + B.ph / 2, 'the formula does not read yet',
             rgbCss(TH.dim), '14px ' + FONT_UI, 'center', 'middle');
      stageNote(ctx, 'fix the formula and the table returns', W, H);
      return;
    }
    const V = E.vars, cols = V.length + 2, rows = E.rows.length;
    const headH = 26;
    const cellW = Math.min(96, B.pw / cols);
    const tableW = cellW * cols;
    const x0 = B.px + (B.pw - tableW) / 2;
    /* Two views, and the switch is legibility rather than taste: past about
       thirty rows the text no longer fits at a readable size, so the values
       become strips. Nothing is truncated in either view — a truncated truth
       table would be a wrong answer wearing the shape of a right one. */
    const rowH = (B.ph - headH) / rows;
    const text = rowH >= 13;
    ctx.font = '600 11px ' + FONT_UI;
    for(let c = 0; c < cols; c++){
      const label = c < V.length ? V[c] : (c === V.length ? 'A' : 'B');
      ctText(ctx, x0 + c * cellW + cellW / 2, B.py + headH - 8, label,
             rgbCss(c < V.length ? TH.dim : TH.text), '600 12px ' + FONT_UI, 'center', 'alphabetic');
    }
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, B.py + headH - 3); ctx.lineTo(x0 + tableW, B.py + headH - 3);
    ctx.moveTo(x0 + V.length * cellW, B.py + 2); ctx.lineTo(x0 + V.length * cellW, B.py + headH + rows * rowH);
    ctx.stroke();
    E.rows.forEach((R, i) => {
      const y = B.py + headH + i * rowH;
      /* a row where the two formulas differ is the evidence, and it is marked
         behind the cells rather than beside them, so it cannot be missed */
      if(!R.agree){
        ctx.fillStyle = 'rgba(' + TH.neg[0] + ',' + TH.neg[1] + ',' + TH.neg[2] + ',0.16)';
        ctx.fillRect(x0 - 4, y, tableW + 8, Math.max(1, rowH - 1));
      }
      /* In strip mode only the two value columns are painted. The variable
         columns would be six more rects per row — 384 rasterising calls a
         frame at the six-letter cap, which is past what a frame can afford —
         and they carry no information the row order does not already give:
         the rows are the standard enumeration, all-true first. */
      for(let c = text ? 0 : V.length; c < cols; c++){
        const v = c < V.length ? R.env[V[c]] : (c === V.length ? R.a : R.b);
        const cx = x0 + c * cellW, cy = y;
        if(text){
          if(c >= V.length){
            ctx.fillStyle = 'rgba(' + pfTF(v)[0] + ',' + pfTF(v)[1] + ',' + pfTF(v)[2] + ',0.20)';
            ctx.fillRect(cx + 2, cy + 1, cellW - 4, rowH - 2);
          }
          ctText(ctx, cx + cellW / 2, cy + rowH / 2, v ? 'T' : 'F',
                 rgbCss(c < V.length ? TH.dim : pfTF(v)),
                 (c < V.length ? '11px ' : '600 12px ') + FONT_UI, 'center', 'middle');
        } else {
          const col = pfTF(v);
          ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' +
                          (c < V.length ? 0.28 : 0.78) + ')';
          ctx.fillRect(cx + 1, cy, cellW - 2, Math.max(1, rowH - 0.5));
        }
      }
    });
    const verdict = E.equal ? 'the two columns are identical on all ' + rows + ' rows'
                            : 'they differ on ' + (rows - E.agreeRows) + ' of ' + rows +
                              ' rows — the shaded ones';
    stageNote(ctx, (text ? '' : 'the two value columns as strips, one row each, all-true row first — ') +
              verdict, W, H);
  },
  derive(st){
    const N = this.cur(st), E = N.E;
    if(!E.ok) return { title:'Nothing to derive yet', steps:[drvSay('the formula does not read', esc(E.why))] };
    const cl = E.clauses.length;
    return {
      title:'Two ways to decide it, sharing nothing but the parser',
      steps:[
        drvSay('what "equivalent" has to mean',
          'Two formulas are equivalent when no assignment of truth values tells them apart. With ' +
          E.vars.length + ' letter' + (E.vars.length === 1 ? '' : 's') + ' there are ' +
          E.rows.length + ' assignments and that is all of them, so the question is finite and the table settles it.'),
        drvStep('route A — evaluate on every assignment',
          `${dv('A')}(${E.vars.join(', ')}) ${dop('=')} ${dv('B')}(${E.vars.join(', ')}) ${dop('for all')} ${E.rows.length} ${dop('rows')}`,
          E.equal ? 'they agree on all ' + E.rows.length + ' rows'
                  : 'they part first at ' + pfEnvWords(E.counter.env) +
                    ', where A is ' + pfWord(E.counter.a) + ' and B is ' + pfWord(E.counter.b)),
        drvSay('route B asks a different question, and never assigns anything',
          'A ↔ B is a tautology exactly when A and B are equivalent. Push every negation down to the letters, distribute ∨ over ∧ until the formula is a conjunction of clauses, and then a clause is unavoidably true exactly when it contains some letter beside its own negation. This is a decision made by looking at the SHAPE of the formula.'),
        drvStep('the biconditional, in clause form',
          `${dv('A')} ${dop('↔')} ${dv('B')} ${dop('⟶')} ${cl} ${dop('clause' + (cl === 1 ? '' : 's'))}`,
          E.overflow ? 'the distribution refused — more than ' + PF_CNF_CAP + ' clauses, which is a formula shape rather than a hard question'
                     : pfCNFText(E.clauses, 4)),
        drvStep('and every clause must hold a letter beside its negation',
          `${dop('valid')} ${dop('⟺')} ${dop('∀ clauses:')} ${dv('x')} ${dop('∨')} ${dop('¬')}${dv('x')} ${dop('∈ clause')}`,
          E.overflow ? 'not available at this formula size'
                     : (E.byCNF ? 'every clause does — so the biconditional is valid'
                                : 'at least one clause does not — so it is not')),
        drvSay('why anyone would bother with the second route',
          'Because the first one does not scale, and because it answers a different kind of question. The table costs 2ⁿ rows: six letters is 64, twenty letters is a million, and a hundred letters is beyond any machine that will ever exist. Clause form is how a real prover works — it never enumerates anything, and resolution (one of the laws in the picker) is the single rule it needs. The cost has moved rather than vanished: distributing ∨ over ∧ is exponential in the worst case, and this panel refuses past ' + PF_CNF_CAP + ' clauses rather than truncating, because a truncated clause list would make an invalid formula look valid.'),
        drvSay('and what a tautology has to do with an argument being valid',
          'An argument is valid when its conclusion cannot be false while its premises are all true — and that is exactly the statement that (premises ∧ … ) → conclusion is a tautology. So the picker holds modus ponens and resolution beside the equivalences on purpose: they are the same kind of object, checked the same way. Affirming the consequent sits there too, failing on one row of four, which is the whole difference between an argument and a fallacy.'),
        drvSay('the two routes agree here, and they are not the same route',
          E.overflow
            ? 'The clause route refused at this size, so only the table has spoken. That is a refusal, not a disagreement: the distribution is exponential in the worst case and the worst case is easy to type.'
            : 'Route A looked at ' + E.rows.length + ' assignments and route B looked at none. They reached ' +
              (E.equal ? 'the same "equivalent"' : 'the same "not equivalent"') +
              '. If they ever disagreed the parser would be the only thing that could be wrong, since nothing else is shared.')
      ],
      note:'Clause form is also how a mechanical prover works, and resolution — one of the laws in the picker — is the single rule it needs.'
    };
  },
  readout(st){
    const N = this.cur(st), E = N.E;
    if(!E.ok)
      return `<div class="card tight"><div class="ttl">The formula does not read</div>
        ${kv('what stopped it', esc(E.why))}
        <p class="help">The previous pair is still drawn. Nothing is guessed and nothing is blanked.</p></div>`;
    const K = pfClassify(N.a), K2 = pfClassify(N.b);
    const kindWord = k => k === 'tautology' ? 'a tautology — true on every row'
                        : (k === 'contradiction' ? 'a contradiction — false on every row'
                                                 : 'contingent — true on some rows and not others');
    return `<div class="card tight"><div class="ttl">${esc(N.name)}</div>
      ${kv('formula A', '<b>' + esc(pfPretty(N.a)) + '</b>')}
      ${kv('formula B', '<b>' + esc(pfPretty(N.b)) + '</b>')}
      ${kv('by the table, on all ' + E.rows.length + ' rows',
           E.equal ? '<span style="color:var(--c-pos)">equivalent</span>'
                   : '<span style="color:var(--c-neg)">not equivalent</span>')}
      ${kv('by clause form, evaluating nothing',
           E.overflow ? 'refused — the distribution passed ' + PF_CNF_CAP + ' clauses'
                      : (E.byCNF ? '<span style="color:var(--c-pos)">equivalent</span>'
                                 : '<span style="color:var(--c-neg)">not equivalent</span>'))}
      ${kv('the two routes', E.overflow ? 'only one of them could answer at this size'
           : (E.agree ? '<span style="color:var(--c-pos)">agree</span>'
                      : '<span style="color:var(--c-neg)">DISAGREE — which would be a defect</span>'))}
      ${E.equal ? '' : kv('the row that settles it',
           '<b>' + esc(pfEnvWords(E.counter.env)) + '</b> — A is ' + pfWord(E.counter.a) +
           ', B is ' + pfWord(E.counter.b))}
      ${N.declared === null ? '' : kv('what this row of the table claims',
           esc(N.ex || '') + ' — ' + (N.declared ? 'that they ARE equivalent' : 'that they are NOT'))}
      ${N.declared === null ? '' : kv('claim, recomputed here',
           N.claimOK ? '<span style="color:var(--c-pos)">confirmed by both routes</span>'
                     : '<span style="color:var(--c-neg)">the claim is wrong</span>')}
    </div>
    <div class="card tight"><div class="ttl">Each formula on its own</div>
      ${kv('A is', kindWord(K.kind) + ' (' + K.table.trueRows + ' of ' + K.table.rows.length + ')')}
      ${kv('B is', kindWord(K2.kind) + ' (' + K2.table.trueRows + ' of ' + K2.table.rows.length + ')')}
      ${kv('rows where they agree', E.agreeRows + ' of ' + E.rowCount)}
      ${st.showClauses ? kv('A in clause form', E.overflow ? 'refused at this size'
           : esc(pfCNFText(pfCNF(pfNNF(pfParse(N.a).ast, false)).clauses, 6))) : ''}
      ${st.showClauses ? kv('the biconditional, in clauses', E.overflow ? 'refused at this size'
           : esc(pfCNFText(E.clauses, 6))) : ''}
      <p class="help">A tautology is what a <b>theorem</b> of the propositional calculus is: true
      whatever the letters mean. That is why the picker holds modus ponens and resolution beside the
      equivalences — an argument being valid is the statement that a particular formula is a tautology.</p>
    </div>
    ${N.why ? `<div class="card tight"><div class="ttl">Why this one matters</div>
      <p class="help">${N.why}</p></div>` : ''}`;
  },
  chip(st){
    const N = this.cur(st), E = N.E;
    if(!E.ok) return `<div class="k">unreadable</div><div style="color:var(--c-neg)">fix the formula</div>`;
    return `<div class="k">${E.rows.length} rows</div>
      <div style="color:${E.equal ? 'var(--c-pos)' : 'var(--c-neg)'}">${E.equal ? 'equivalent' : 'not equivalent'}</div>
      <div style="color:var(--c-dim)">${E.overflow ? 'clause route refused' : 'both routes agree'}</div>`;
  },
  legend(){
    return [[rgbCss(TH.pos), 'true'], [rgbCss(TH.neg), 'false'],
            ['rgba(' + TH.neg[0] + ',' + TH.neg[1] + ',' + TH.neg[2] + ',0.35)', 'a row where A and B differ']];
  },
  dockLegend:true
};

/* ---- 2 · quantifiers ------------------------------------------------------ */
const PF_REL_SLOT = [{ k:'rel', label:'R(x, y) holds where', def:'y - x', vars:'an expression in x and y — the relation holds where it is POSITIVE',
                       audit:'x*y - 6', build:s => { const g = compile(parse(String(s))); g(1, 1, 0); return { f:g }; } }];

STAGES.pfQuant = {
  title:'∀ and ∃, and why the order matters',
  enter(st, o){
    st.rel = o.rel || 'lt';
    st.n = o.n === undefined ? 6 : o.n;
    st.qkey = o.qkey || 'AEy';
  },
  cur(st){
    const n = Math.max(2, Math.min(12, Math.round(st.n)));
    let R, name, why = '', ok = true, badWhy = '';
    if(st.rel === 'custom'){
      const own = pkOwn(st, 'pfQr', PF_REL_SLOT);
      const P = pfRelFromExpr(own.rel);
      ok = P.ok; badWhy = P.why;
      R = P.ok ? P.f : PF_RELS.lt.f;
      name = 'your relation: ' + own.rel + ' > 0';
    } else {
      R = PF_RELS[st.rel].f; name = PF_RELS[st.rel].name; why = PF_RELS[st.rel].why;
    }
    const all = pfQuantAll(R, n);
    return { n, R, name, why, ok, badWhy, all, Q:all[st.qkey], spec:PF_QUANTS[st.qkey],
             cells:pfRelGrid(R, n) };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('pfQq', st.qkey, Object.keys(PF_QUANTS).map(k => [k, PF_QUANTS[k].lbl])) +
      pkSeg('pfQr', PF_RELS, st.rel, e => e.ex) +
      pkBoxes('pfQr', st.rel, st, PF_REL_SLOT, null,
              'Any expression in <b>x</b> and <b>y</b>. The relation holds at the pairs where it is ' +
              'positive, so <b>y - x</b> is "x &lt; y", <b>x*y - 6</b> is "the product exceeds six", and ' +
              '<b>sin(x*y)</b> is a relation with no name at all.') +
      ctlRow('the domain is 1 … n', ctlSlider('pfQn', 2, 12, 1, st.n)) +
      `${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.badWhy)} — the grid keeps the last relation that read.</p>`}
      <p class="help"><b>A quantifier over a finite domain is a loop</b>, so both the statement and its
      negation can be settled here rather than argued about. The grid shows the pairs where R holds;
      the bar beside each row is how many partners that element has, which is the second route.</p>
      <p class="help">The pair to compare is <b>∀x∃y</b> against <b>∃y∀x</b>. The first lets y depend on
      x; the second demands one y that works for every x at once. Every relation in the picker is
      chosen because those two come apart on it somewhere in the range of n.</p>`;
  },
  wire(){
    ctWireSeg('pfQq', v => { ST.qkey = v; });
    pkWire('pfQr', 'pfQr', ST.rel, ST, PF_REL_SLOT, null, v => { ST.rel = v; });
    wireSlider('pfQn', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), n = N.n, Q = N.Q;
    const z = ctChipZone(ctx);
    const top = Math.max(40, z.h + 14);
    const B = ctFitBox(46, top, W - 92, H - top - 44);
    /* a square grid, because the relation is on one set against itself and an
       oblong would suggest two different domains */
    const side = Math.min(B.pw - 70, B.ph);
    const cell = side / n;
    const gx = B.px + (B.pw - 70 - side) / 2 + 30, gy = B.py;
    /* the outer value the statement is about — a row of the grid when the
       outer variable is x, a column when it is y */
    const outerIsX = N.spec.outer === 'x';
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, side, side);
    for(let i = 1; i <= n; i++){
      ctText(ctx, gx - 8, gy + (i - 0.5) * cell, String(i), rgbCss(TH.dim),
             '10px ' + FONT_UI, 'right', 'middle');
      ctText(ctx, gx + (i - 0.5) * cell, gy + side + 14, String(i), rgbCss(TH.dim),
             '10px ' + FONT_UI, 'center', 'alphabetic');
    }
    ctText(ctx, gx - 8, gy - 8, 'x', rgbCss(TH.text), '600 12px ' + FONT_UI, 'right', 'alphabetic');
    ctText(ctx, gx + side + 6, gy + side + 14, 'y', rgbCss(TH.text), '600 12px ' + FONT_UI, 'left', 'alphabetic');
    /* the cells where R holds */
    ctx.fillStyle = 'rgba(' + TH.accent[0] + ',' + TH.accent[1] + ',' + TH.accent[2] + ',0.55)';
    for(const c of N.cells)
      ctx.fillRect(gx + (c.y - 1) * cell + 1, gy + (c.x - 1) * cell + 1, cell - 2, cell - 2);
    /* the witness or counterexample: the object a proof would have to hand you */
    if(Q.A.outer !== null){
      const oi = Q.A.outer;
      const col = Q.A.val ? TH.pos : TH.neg;
      ctx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.95)';
      ctx.lineWidth = 2;
      if(outerIsX) ctx.strokeRect(gx, gy + (oi - 1) * cell, side, cell);
      else ctx.strokeRect(gx + (oi - 1) * cell, gy, cell, side);
      if(Q.A.inner !== null){
        const ii = Q.A.inner;
        const cx = outerIsX ? gx + (ii - 1) * cell : gx + (oi - 1) * cell;
        const cy = outerIsX ? gy + (oi - 1) * cell : gy + (ii - 1) * cell;
        ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.85)';
        ctx.fillRect(cx + 1, cy + 1, cell - 2, cell - 2);
      }
    }
    /* route B, drawn: how many partners each outer value has */
    const counts = Q.B.counts, maxc = Math.max(1, n);
    const bx = gx + side + 12, bw = 46;
    ctText(ctx, bx, gy - 8, 'how many', rgbCss(TH.faint), '10px ' + FONT_UI, 'left', 'alphabetic');
    for(let i = 0; i < counts.length; i++){
      const w = bw * counts[i] / maxc;
      const y = outerIsX ? gy + i * cell : gy + i * cell;
      ctx.fillStyle = counts[i] === 0
        ? 'rgba(' + TH.neg[0] + ',' + TH.neg[1] + ',' + TH.neg[2] + ',0.8)'
        : 'rgba(' + TH.mid[0] + ',' + TH.mid[1] + ',' + TH.mid[2] + ',0.7)';
      ctx.fillRect(bx, y + 1.5, Math.max(counts[i] === 0 ? 3 : 1, w), Math.max(1, cell - 3));
      if(cell >= 13)
        ctText(ctx, bx + bw + 6, y + cell / 2, String(counts[i]), rgbCss(TH.dim),
               '10px ' + FONT_UI, 'left', 'middle');
    }
    stageNote(ctx, N.spec.lbl + ' is ' + (Q.val ? 'TRUE' : 'FALSE') + '   ·   ' +
              (Q.A.outer === null ? Q.A.kind
               : (Q.A.val ? 'witness ' : 'counterexample ') + (outerIsX ? 'x = ' : 'y = ') + Q.A.outer +
                 (Q.A.inner === null ? '' : (outerIsX ? ', y = ' : ', x = ') + Q.A.inner)), W, H);
  },
  derive(st){
    const N = this.cur(st), Q = N.Q, n = N.n;
    const counts = Q.B.counts;
    return {
      title:'One statement, three routes',
      steps:[
        drvSay('a quantifier on a finite domain is a loop',
          'Which is the whole reason this stage can exist. ∀ is a loop that stops at the first failure; ∃ is a loop that stops at the first success. On an infinite domain neither loop terminates and the statement needs a proof — but the SHAPE of the statement is the same, and it is the shape that is worth getting into your hands.'),
        drvStep('route A — the loops, which also produce the object',
          `${dop(N.spec.oq === 'A' ? '∀' : '∃')}${dv(N.spec.outer)} ${dop(N.spec.iq === 'A' ? '∀' : '∃')}${dv(N.spec.outer === 'x' ? 'y' : 'x')} ${dv('R')}`,
          Q.A.outer === null ? Q.A.kind
            : (Q.A.val ? 'a witness: ' : 'a counterexample: ') + N.spec.outer + ' = ' + Q.A.outer +
              (Q.A.inner === null ? '' : ', the other = ' + Q.A.inner)),
        drvStep('route B — count, and read the statement off the counts',
          N.spec.iq === 'E'
            ? `${dop(N.spec.oq === 'A' ? 'every' : 'some')} ${dop('count')} ${dop('>')} 0`
            : `${dop(N.spec.oq === 'A' ? 'every' : 'some')} ${dop('count')} ${dop('=')} ${dv('n')}`,
          'counts are ' + counts.join(', ') + ' — ' + (Q.B.val ? 'the condition holds' : 'it does not')),
        drvStep('route C — negate everything and negate the answer',
          `${dop('¬')}${dop(N.spec.oq === 'A' ? '∀' : '∃')}${dv(N.spec.outer)} ${dop(N.spec.iq === 'A' ? '∀' : '∃')}${dv('·')} ${dv('R')} ${dop('≡')} ${dop(N.spec.oq === 'A' ? '∃' : '∀')}${dv(N.spec.outer)} ${dop(N.spec.iq === 'A' ? '∃' : '∀')}${dv('·')} ${dop('¬')}${dv('R')}`,
          'the dual is ' + pfWord(Q.C.dual.val) + ', so the statement is ' + pfWord(Q.C.val)),
        drvSay('all three agree, and the third is the one to remember',
          'Negating a quantified statement flips every quantifier and negates the inside. That is the rule that turns "f is continuous at a" into a usable "f is not continuous at a", and getting it wrong is the commonest error in a first analysis course — which is why it is a route here rather than a remark.'),
        drvStep('and the two orders, side by side',
          `${dop('∀')}${dv('x')}${dop('∃')}${dv('y')} ${dv('R')} ${dop('vs')} ${dop('∃')}${dv('y')}${dop('∀')}${dv('x')} ${dv('R')}`,
          pfWord(N.all.AEy.val) + '  vs  ' + pfWord(N.all.EAx.val) +
          (N.all.AEy.val === N.all.EAx.val
            ? ' — the same here, which is a fact about this relation and not about the symbols'
            : ' — different, and the second is the stronger claim')),
        drvSay('∃y∀x always implies ∀x∃y, and never the other way round',
          'One y that works for everybody certainly gives everybody a y. The converse fails whenever the choice has to depend on x, which on this domain is exactly what the ' + n + '-by-' + n + ' grid shows: a row-by-row search finding a different partner each time.')
      ],
      note:'“For every ε there is a δ” is this asymmetry doing the work of the whole of analysis: δ may depend on ε, and uniform continuity is precisely the statement that it need not.'
    };
  },
  readout(st){
    const N = this.cur(st), n = N.n;
    const line = k => {
      const Q = N.all[k];
      return kv(PF_QUANTS[k].lbl,
        `<span style="color:${pfTFcss(Q.val)}">${pfWord(Q.val)}</span>` +
        (Q.A.outer === null ? '' : `  <span style="color:var(--c-dim)">(${Q.A.val ? 'witness' : 'counterexample'} ${PF_QUANTS[k].outer} = ${Q.A.outer})</span>`));
    };
    const allAgree = Object.keys(N.all).every(k => N.all[k].agree);
    return `<div class="card tight"><div class="ttl">${esc(N.name)}, on {1 … ${n}}</div>
      ${kv('pairs where R holds', N.cells.length + ' of ' + (n * n))}
      ${kv('the statement showing', N.spec.lbl)}
      ${kv('its value', `<span style="color:${pfTFcss(N.Q.val)}">${pfWord(N.Q.val)}</span>`)}
      ${kv('what settles it', N.Q.A.outer === null ? N.Q.A.kind
           : (N.Q.A.val ? 'the witness ' : 'the counterexample ') + N.spec.outer + ' = ' + N.Q.A.outer +
             (N.Q.A.inner === null ? '' : ' with ' + (N.spec.outer === 'x' ? 'y' : 'x') + ' = ' + N.Q.A.inner))}
      ${kv('three routes', allAgree ? '<span style="color:var(--c-pos)">loops, counts and the negated dual all agree</span>'
                                    : '<span style="color:var(--c-neg)">they disagree — which would be a defect</span>')}
    </div>
    <div class="card tight"><div class="ttl">All six statements at once</div>
      ${['AA', 'AEy', 'EAx', 'AEx', 'EAy', 'EE'].map(line).join('')}
      <p class="help">Read the middle two together. <b>∃y∀x ⇒ ∀x∃y</b> always, and the converse is
      false in general — so a row where the first is false and the second true is not a curiosity, it
      is the ordinary situation. A row where both are true means one y served everybody.</p>
    </div>
    ${N.why ? `<div class="card tight"><div class="ttl">Why this relation</div><p class="help">${N.why}</p></div>` : ''}`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">${N.spec.lbl}</div>
      <div style="color:${pfTFcss(N.Q.val)}">${pfWord(N.Q.val)}</div>
      <div style="color:var(--c-dim)">${N.cells.length} of ${N.n * N.n} pairs</div>`;
  },
  legend(st){
    const N = this.cur(st);
    return [['rgba(' + TH.accent[0] + ',' + TH.accent[1] + ',' + TH.accent[2] + ',0.55)', 'R(x, y) holds here'],
            [rgbCss(N.Q.val ? TH.pos : TH.neg), N.Q.val ? 'the witness' : 'the counterexample'],
            [rgbCss(TH.mid), 'how many partners this element has'],
            [rgbCss(TH.neg), 'none at all — which refutes ∀x∃y']];
  },
  dockLegend:true
};
