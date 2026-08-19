/* ============================================================================
   6gc · PROOF, LOGIC & SETS — the sets stages   (Programme C wing C1)

     pfSets    three sets, eight regions, and an identity checked two ways
     pfMap     injective, surjective, bijective — drawn, and then counted
     pfCount   Cantor's pairing and Cantor's diagonal, both run rather than
               described

   The identities here are the logic wing's laws wearing different clothes, and
   the stages say so: a set is a predicate, ∩ is ∧, and De Morgan is the same
   theorem twice. What sets add is SIZE, which is what the last stage is about.
   ============================================================================ */

/* ---- 1 · sets ------------------------------------------------------------- */
const PF_TRIOS = {
  classic: { name:'even · prime · multiples of 3', a:'even', b:'prime', c:'triple',
             why:'The default, and a good one: the three sets overlap in every possible way, so all seven regions of the Venn diagram are occupied and every term of inclusion–exclusion is doing work.' },
  parity:  { name:'even · odd · squares', a:'even', b:'odd', c:'square',
             why:'Even and odd are disjoint and their union is everything, so three of the seven regions are EMPTY — which is the case where a careless identity looks true because there is nothing to falsify it. Every law is checked on several triples for exactly this reason.' },
  nested:  { name:'multiples of 3 · Fibonacci · the first half', a:'triple', b:'fib', c:'small',
             why:'Uneven and lopsided, with one set much larger than the others. Inclusion–exclusion is easiest to get wrong when the sets have very different sizes, because the correction terms stop being small.' },
  primes:  { name:'primes · squares · Fibonacci', a:'prime', b:'square', c:'fib',
             why:'Three thin sets: most of the universe is outside all of them, and the identity still has to hold there. The complement laws are the ones this triple exercises.' }
};
const PF_SET_SLOTS = [
  { k:'a', label:'set A', def:'x - 4', vars:'an expression in x — the set is where it is POSITIVE', audit:'sin(x)', build:s => { const g = compile(parse(String(s))); g(1, 0, 0); return { f:g }; } },
  { k:'b', label:'set B', def:'12 - x', vars:'an expression in x', audit:'cos(x)', build:s => { const g = compile(parse(String(s))); g(1, 0, 0); return { f:g }; } },
  { k:'c', label:'set C', def:'sin(x)', vars:'an expression in x', audit:'x - 9', build:s => { const g = compile(parse(String(s))); g(1, 0, 0); return { f:g }; } }
];

STAGES.pfSets = {
  title:'Three sets, eight regions, one identity',
  enter(st, o){
    st.trio = o.trio || 'classic';
    st.law = o.law || 'deMorganU';
    st.n = o.n === undefined ? 16 : o.n;
  },
  cur(st){
    const n = Math.max(6, Math.min(24, Math.round(st.n)));
    let A, B, C, name, why = '', ok = true, badWhy = '';
    if(st.trio === 'custom'){
      const own = pkOwn(st, 'pfSt', PF_SET_SLOTS);
      const MA = pfMaskFromExpr(own.a, n), MB = pfMaskFromExpr(own.b, n), MC = pfMaskFromExpr(own.c, n);
      ok = MA.ok && MB.ok && MC.ok;
      badWhy = MA.ok ? (MB.ok ? MC.why : MB.why) : MA.why;
      A = MA.mask; B = MB.mask; C = MC.mask;
      name = 'your three sets';
    } else {
      const T = PF_TRIOS[st.trio];
      A = pfMaskOf(T.a, n); B = pfMaskOf(T.b, n); C = pfMaskOf(T.c, n);
      name = T.name; why = T.why;
    }
    const S = pfSetCheck(st.law, A, B, C, n);
    return { n, A, B, C, name, why, ok, badWhy, S,
             regions:pfVennRegions(A, B, C, n), IE:pfInclExcl3(A, B, C, n),
             PS:pfPowerSet(A, n, PF_SUBSET_CAP) };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('pfStL', st.law, Object.keys(PF_SET_LAWS).map(k => [k, PF_SET_LAWS[k].ex])) +
      pkSeg('pfSt', PF_TRIOS, st.trio, e => e.name) +
      pkBoxes('pfSt', st.trio, st, PF_SET_SLOTS, null,
              'Three expressions in <b>x</b>. Each set holds the elements where its expression is ' +
              'positive, so <b>x - 4</b> is everything above four and <b>sin(x)</b> is a set with no ' +
              'description shorter than its list.') +
      ctlRow('the universe is 1 … n', ctlSlider('pfStN', 6, 24, 1, st.n)) +
      `${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.badWhy)} — the diagram keeps the last three sets that read.</p>`}
      <p class="help"><b>Every region carries its own count.</b> A finite set is a 32-bit integer here,
      one bit per element, so ∪ is a bitwise or and ∩ is a bitwise and — and an identity between two
      set expressions becomes two integers being equal, which is exact and has no tolerance to argue about.</p>
      <p class="help">The identity is then checked a second time the way a <i>proof</i> checks it:
      element by element, "x is in the left side exactly when it is in the right". The strip under the
      diagram is that check, one square per element, and any square where the two sides disagree is
      marked. Two of the identities in the picker are false, and that is where you will see one.</p>`;
  },
  wire(){
    ctWireSeg('pfStL', v => { ST.law = v; });
    pkWire('pfSt', 'pfSt', ST.trio, ST, PF_SET_SLOTS, null, v => { ST.trio = v; });
    wireSlider('pfStN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), S = N.S, n = N.n;
    const z = ctChipZone(ctx);
    const top = Math.max(40, z.h + 12);
    const stripH = 54;
    const B = ctFitBox(30, top, W - 60, H - top - 44 - stripH);
    const r = Math.min(B.pw / 3.4, B.ph / 2.9);
    const cx = B.px + B.pw / 2, cy = B.py + B.ph / 2 - r * 0.1;
    const cs = [{ x:cx - r * 0.52, y:cy - r * 0.30, col:TH.accent, label:'A' },
                { x:cx + r * 0.52, y:cy - r * 0.30, col:TH.mid, label:'B' },
                { x:cx,            y:cy + r * 0.58, col:TH.curl, label:'C' }];
    cs.forEach(c => {
      ctx.strokeStyle = 'rgba(' + c.col[0] + ',' + c.col[1] + ',' + c.col[2] + ',0.9)';
      ctx.fillStyle = 'rgba(' + c.col[0] + ',' + c.col[1] + ',' + c.col[2] + ',0.10)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 6.2832); ctx.fill(); ctx.stroke();
    });
    ctText(ctx, cs[0].x - r * 0.86, cs[0].y - r * 0.72, 'A', rgbCss(TH.accent), '600 14px ' + FONT_UI, 'center', 'middle');
    ctText(ctx, cs[1].x + r * 0.86, cs[1].y - r * 0.72, 'B', rgbCss(TH.mid), '600 14px ' + FONT_UI, 'center', 'middle');
    ctText(ctx, cs[2].x, cs[2].y + r * 0.92, 'C', rgbCss(TH.curl), '600 14px ' + FONT_UI, 'center', 'middle');
    /* the seven regions, each labelled with its own size — which is what makes
       inclusion–exclusion something to read rather than to believe */
    const at = { 1:[-0.95, -0.45], 2:[0.95, -0.45], 4:[0, 1.02],
                 3:[0, -0.62], 5:[-0.62, 0.42], 6:[0.62, 0.42], 7:[0, 0.10] };
    N.regions.forEach(R => {
      if(R.code === 0) return;
      const p = at[R.code];
      ctText(ctx, cx + p[0] * r, cy + p[1] * r, String(R.size),
             rgbCss(R.size ? TH.text : TH.faint), '600 13px ' + FONT_UI, 'center', 'middle');
    });
    const out = N.regions.filter(R => R.code === 0)[0];
    ctText(ctx, B.px + 4, B.py + 14, 'outside all three: ' + out.size,
           rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
    /* the strip: the identity, checked one element at a time */
    const sy = B.py + B.ph + 16;
    const cw = Math.min(26, (B.pw - 4) / n);
    const sx = B.px + (B.pw - cw * n) / 2;
    ctText(ctx, B.px, sy - 6, 'each element: in the left side, in the right side',
           rgbCss(TH.faint), '11px ' + FONT_UI, 'left', 'alphabetic');
    for(let i = 1; i <= n; i++){
      const inL = pfIn(S.lhs, i), inR = pfIn(S.rhs, i);
      const x = sx + (i - 1) * cw;
      [inL, inR].forEach((v, row) => {
        const col = v ? TH.pos : TH.line2;
        ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (v ? 0.8 : 0.5) + ')';
        ctx.fillRect(x + 1, sy + row * 11, cw - 2, 9);
      });
      if(inL !== inR){
        ctx.strokeStyle = rgbCss(TH.neg); ctx.lineWidth = 1.6;
        ctx.strokeRect(x, sy - 1, cw, 22);
      }
      if(cw >= 14)
        ctText(ctx, x + cw / 2, sy + 34, String(i), rgbCss(TH.faint), '9px ' + FONT_UI, 'center', 'alphabetic');
    }
    stageNote(ctx, PF_SET_LAWS[st.law].ex + '   ·   ' +
      (S.equal ? 'the two sides hold the same elements'
               : 'they differ at ' + S.differs.length + ' element' + (S.differs.length === 1 ? '' : 's') +
                 ': ' + S.differs.slice(0, 6).join(', ')), W, H);
  },
  derive(st){
    const N = this.cur(st), S = N.S, IE = N.IE;
    return {
      title:'A set identity, decided twice',
      steps:[
        drvSay('a finite set is a predicate, and here it is also an integer',
          'One bit per element. Then ∪ is a bitwise or, ∩ is a bitwise and, complement is a bitwise not against the universe — and two sets are equal exactly when two integers are. That is route A, and it has no tolerance because there is nothing to round.'),
        drvStep('route A — build both sides and compare',
          `${dv('L')} ${dop('=')} ${dv('R')} ${dop('as integers')}`,
          S.sameMask ? 'equal: both are ' + pfSetText(S.lhs, N.n, 8)
                     : 'not equal: ' + pfSetText(S.lhs, N.n, 6) + '  vs  ' + pfSetText(S.rhs, N.n, 6)),
        drvSay('route B is what a proof of a set identity actually does',
          '"Let x be in the left side. Then …, so x is in the right side. Conversely …". That argument is a loop over elements, and the strip under the diagram is that loop run: ' + S.law.elem + '.'),
        drvStep('route B — membership, one element at a time',
          `${dv('x')} ${dop('∈')} ${dv('L')} ${dop('⟺')} ${dv('x')} ${dop('∈')} ${dv('R')} ${dop('for each')} ${dv('x')}`,
          S.sameElem ? 'holds for all ' + N.n + ' elements'
                     : 'fails at ' + S.differs.slice(0, 8).join(', ')),
        drvStep('and the eight regions, which are what a Venn diagram is for',
          `|${dv('A')}${dop('∪')}${dv('B')}${dop('∪')}${dv('C')}| ${dop('=')} ${dop('Σ')}|${dv('A')}| ${dop('−')} ${dop('Σ')}|${dv('A')}${dop('∩')}${dv('B')}| ${dop('+')} |${dv('A')}${dop('∩')}${dv('B')}${dop('∩')}${dv('C')}|`,
          IE.byFormula + ' by the formula, ' + IE.byUnion + ' by counting the union, ' +
          IE.byRegions + ' by adding the seven regions — ' + (IE.agree ? 'all three identical' : 'THEY DISAGREE')),
        drvSay('why the signs alternate',
          'Adding the three sizes counts a two-set overlap twice and the triple overlap three times. Subtracting the three pairwise overlaps removes the doubles but takes the triple region away three times, leaving it at zero — so it must be added back once. Each element is counted exactly once when the signs alternate, and the general statement of that is the counting wing’s inclusion–exclusion.'),
        drvStep('the power set of A, formula against enumeration',
          `|${dop('𝒫')}(${dv('A')})| ${dop('=')} 2${uniSup('^|A|')}`,
          N.PS.overflow ? '|A| = ' + N.PS.k + ', so 2^' + N.PS.k + ' subsets — too many to build here, and the count refuses rather than truncating'
                        : '2^' + N.PS.k + ' = ' + N.PS.closed + ', and ' + N.PS.enumerated + ' were built one at a time')
      ],
      note:'Every identity in the picker has a twin in the logic stage. A set is a predicate; ∩ is ∧; complement is ¬. The proofs transcribe.'
    };
  },
  readout(st){
    const N = this.cur(st), S = N.S, IE = N.IE, n = N.n;
    return `<div class="card tight"><div class="ttl">${esc(S.law.ex)}</div>
      ${kv('by bitmask algebra', S.sameMask ? '<span style="color:var(--c-pos)">the two sides are the same set</span>'
                                            : '<span style="color:var(--c-neg)">they are different sets</span>')}
      ${kv('by membership, element by element', S.sameElem ? '<span style="color:var(--c-pos)">every element agrees</span>'
           : '<span style="color:var(--c-neg)">disagrees at ' + S.differs.join(', ') + '</span>')}
      ${kv('the two routes', S.agree ? '<span style="color:var(--c-pos)">agree</span>'
                                     : '<span style="color:var(--c-neg)">disagree, which would be a defect</span>')}
      ${kv('what this row claims', S.law.holds ? 'that the identity holds' : 'that it does NOT')}
      ${kv('claim, recomputed', S.claimOK ? '<span style="color:var(--c-pos)">confirmed</span>'
                                          : '<span style="color:var(--c-neg)">the claim is wrong</span>')}
      ${kv('left side', esc(pfSetText(S.lhs, n, 10)))}
      ${kv('right side', esc(pfSetText(S.rhs, n, 10)))}
    </div>
    <div class="card tight"><div class="ttl">The three sets, on {1 … ${n}}</div>
      ${kv('A', esc(pfSetText(N.A, n, 10)) + '  — ' + pfCard(N.A) + ' elements')}
      ${kv('B', esc(pfSetText(N.B, n, 10)) + '  — ' + pfCard(N.B) + ' elements')}
      ${kv('C', esc(pfSetText(N.C, n, 10)) + '  — ' + pfCard(N.C) + ' elements')}
      ${kv('|A ∪ B ∪ C|', IE.byFormula + ' by inclusion–exclusion, ' + IE.byUnion + ' by direct count')}
      ${kv('and by adding the seven regions', IE.byRegions + (IE.agree
           ? ' — <span style="color:var(--c-pos)">all three identical</span>'
           : ' — <span style="color:var(--c-neg)">they disagree</span>'))}
      ${kv('subsets of A', N.PS.overflow ? '2^' + N.PS.k + ' — too many to build'
           : N.PS.closed + ' by the formula, ' + N.PS.enumerated + ' built and counted')}
    </div>
    ${N.why ? `<div class="card tight"><div class="ttl">Why this triple</div><p class="help">${N.why}</p></div>` : ''}
    <div class="card tight"><div class="ttl">Why it matters</div><p class="help">${S.law.why}</p></div>`;
  },
  chip(st){
    const N = this.cur(st), S = N.S;
    return `<div class="k">${esc(S.law.ex)}</div>
      <div style="color:${S.equal ? 'var(--c-pos)' : 'var(--c-neg)'}">${S.equal ? 'holds here' : 'fails here'}</div>
      <div style="color:var(--c-dim)">|A∪B∪C| = ${N.IE.byUnion}</div>`;
  },
  legend(){
    return [[rgbCss(TH.accent), 'set A'], [rgbCss(TH.mid), 'set B'], [rgbCss(TH.curl), 'set C'],
            [rgbCss(TH.pos), 'this element is in that side'],
            [rgbCss(TH.neg), 'the two sides disagree here']];
  },
  dockLegend:true
};

/* ---- 2 · functions between finite sets ------------------------------------ */
const PF_MAP_SLOT = [{ k:'f', label:'f(x) =', def:'2x + 1',
                       vars:'an expression in x — the value is rounded and wrapped into 1 … n',
                       audit:'x*x - 2',
                       build:s => { const g = compile(parse(String(s))); g(1, 0, 0); return { f:g }; } }];

STAGES.pfMap = {
  title:'Injective, surjective, and what each one costs',
  enter(st, o){
    st.map = o.map || 'shift';
    st.m = o.m === undefined ? 6 : o.m;
    st.n = o.n === undefined ? 6 : o.n;
  },
  cur(st){
    const m = Math.max(1, Math.min(9, Math.round(st.m)));
    const n = Math.max(1, Math.min(9, Math.round(st.n)));
    let M, name, why = '', ok = true, badWhy = '';
    if(st.map === 'custom'){
      const own = pkOwn(st, 'pfMp', PF_MAP_SLOT);
      let g = null;
      try { g = compile(parse(String(own.f))); g(1, 0, 0); }
      catch(e){ ok = false; badWhy = String(e && e.message || e); }
      const f = ok ? (k, nn) => {
        const v = g(k, 0, 0);
        if(!Number.isFinite(v)) return 1;
        /* wrapped rather than clamped: clamping would pile every large value
           onto n and manufacture a collision the reader did not write */
        return ((Math.round(v) - 1) % nn + nn) % nn + 1;
      } : PF_MAPS.shift.f;
      M = pfMapCheckWith(f, m, n, 'your f(x) = ' + own.f);
      name = 'your map';
    } else {
      M = pfMapCheck(st.map, m, n);
      name = PF_MAPS[st.map].name; why = PF_MAPS[st.map].why;
    }
    return { m, n, M, name, why, ok, badWhy,
             inj:pfInjectionCount(m, n), surj:pfSurjectionCount(m, n) };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return pkSeg('pfMp', PF_MAPS, st.map, e => e.name) +
      pkBoxes('pfMp', st.map, st, PF_MAP_SLOT, null,
              'Any expression in <b>x</b>: <b>2x + 1</b>, <b>x*x</b>, <b>3x</b>. The value is rounded ' +
              'and wrapped into 1 … n, so every input lands somewhere and the properties are about ' +
              'your formula rather than about the wrapping.') +
      ctlRow('domain size m', ctlSlider('pfMpM', 1, 9, 1, st.m)) +
      ctlRow('codomain size n', ctlSlider('pfMpN', 1, 9, 1, st.n)) +
      `${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.badWhy)} — the picture keeps the last map that read.</p>`}
      <p class="help"><b>Injective</b> means no two arrows land together; <b>surjective</b> means no
      target is missed; <b>bijective</b> is both, and only then does an inverse exist. The panel does
      not merely report the three words — it shows the two arrows that collide, and names the targets
      that were missed.</p>
      <p class="help">Push m above n and injectivity becomes impossible: that is the <b>pigeonhole
      principle</b>, and it is the rare theorem whose proof is its statement. Push n above m and
      surjectivity becomes impossible for the same reason read backwards.</p>`;
  },
  wire(){
    pkWire('pfMp', 'pfMp', ST.map, ST, PF_MAP_SLOT, null, v => { ST.map = v; });
    wireSlider('pfMpM', () => ST.m, v => { ST.m = Math.round(v); }, v => 'm = ' + Math.round(v));
    wireSlider('pfMpN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), M = N.M;
    const z = ctChipZone(ctx);
    const top = Math.max(44, z.h + 16);
    const B = ctFitBox(40, top, W - 80, H - top - 46);
    const lx = B.px + B.pw * 0.28, rx = B.px + B.pw * 0.72;
    const dotR = Math.min(11, B.ph / (2.6 * Math.max(N.m, N.n)));
    const yOf = (i, count) => B.py + 22 + (B.ph - 44) * (count === 1 ? 0.5 : i / (count - 1));
    ctText(ctx, lx, B.py + 6, 'domain, ' + N.m + ' elements', rgbCss(TH.faint), '11px ' + FONT_UI, 'center', 'alphabetic');
    ctText(ctx, rx, B.py + 6, 'codomain, ' + N.n + ' elements', rgbCss(TH.faint), '11px ' + FONT_UI, 'center', 'alphabetic');
    /* the arrows first, so the dots sit on top of them */
    M.arrows.forEach(a => {
      const y0 = yOf(a.from - 1, N.m), y1 = yOf(a.to - 1, N.n);
      const clash = !M.injective && M.collision &&
                    (a.from === M.collision.a || a.from === M.collision.b);
      ctx.strokeStyle = clash ? 'rgba(' + TH.neg[0] + ',' + TH.neg[1] + ',' + TH.neg[2] + ',0.95)'
                              : 'rgba(' + TH.accent[0] + ',' + TH.accent[1] + ',' + TH.accent[2] + ',0.6)';
      ctx.lineWidth = clash ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.moveTo(lx + dotR + 2, y0);
      ctx.bezierCurveTo(lx + B.pw * 0.2, y0, rx - B.pw * 0.2, y1, rx - dotR - 2, y1);
      ctx.stroke();
    });
    for(let i = 1; i <= N.m; i++){
      const y = yOf(i - 1, N.m);
      ctx.fillStyle = rgbCss(TH.text);
      ctx.beginPath(); ctx.arc(lx, y, dotR * 0.5, 0, 6.2832); ctx.fill();
      ctText(ctx, lx - dotR - 6, y, String(i), rgbCss(TH.dim), '11px ' + FONT_UI, 'right', 'middle');
    }
    for(let v = 1; v <= N.n; v++){
      const y = yOf(v - 1, N.n), missed = M.missed.indexOf(v) >= 0;
      ctx.fillStyle = rgbCss(missed ? TH.neg : TH.pos);
      ctx.beginPath(); ctx.arc(rx, y, dotR * 0.5, 0, 6.2832); ctx.fill();
      ctText(ctx, rx + dotR + 6, y, String(v) + (missed ? '  never hit' : ''),
             rgbCss(missed ? TH.neg : TH.dim), '11px ' + FONT_UI, 'left', 'middle');
    }
    stageNote(ctx, (M.injective ? 'injective' : 'not injective') + '  ·  ' +
                   (M.surjective ? 'surjective' : 'not surjective') + '  ·  ' +
                   (M.bijective ? 'so bijective — an inverse exists'
                                : 'so no inverse') +
                   (M.forcedCollision ? '   ·   m > n, so pigeonhole forced the collision' : ''), W, H);
  },
  derive(st){
    const N = this.cur(st), M = N.M;
    return {
      title:'The three words, and the two counts behind them',
      steps:[
        drvStep('injective — no two inputs share an output',
          `${dv('f')}(${dv('a')}) ${dop('=')} ${dv('f')}(${dv('b')}) ${dop('⟹')} ${dv('a')} ${dop('=')} ${dv('b')}`,
          M.injective ? 'holds: all ' + N.m + ' arrows land apart'
                      : 'fails: ' + M.collision.a + ' and ' + M.collision.b + ' both land on ' + M.collision.at),
        drvStep('surjective — nothing in the codomain is missed',
          `${dop('∀')}${dv('y')} ${dop('∃')}${dv('x')}: ${dv('f')}(${dv('x')}) ${dop('=')} ${dv('y')}`,
          M.surjective ? 'holds: all ' + N.n + ' targets are hit'
                       : 'fails: ' + M.missed.join(', ') + ' never occur' + (M.missed.length === 1 ? 's' : '')),
        drvSay('and that second line is the ∀∃ of the quantifier stage, doing a job',
          'Surjectivity IS a ∀∃ statement, with the witness allowed to depend on y. The picture is the same picture: a row for every target, and the question of whether each has an arrow into it.'),
        drvStep('pigeonhole, which is this table read as an inequality',
          `${dv('m')} ${dop('>')} ${dv('n')} ${dop('⟹')} ${dop('no injection exists')}`,
          N.m + ' into ' + N.n + ' — ' + (M.forcedCollision ? 'a collision is forced, whatever f is'
                                                            : 'no collision is forced by counting alone')),
        drvStep('how many injections there are, by formula',
          `${dv('n')}(${dv('n')}${dop('−')}1)${dop('⋯')}(${dv('n')}${dop('−')}${dv('m')}${dop('+')}1)`,
          N.inj.closed + (N.inj.overflow ? ' — too many to build one at a time'
                                         : ', and ' + N.inj.enumerated + ' were built and counted')),
        drvStep('and how many surjections, which needs inclusion–exclusion',
          `${dop('Σ')}(${dop('−')}1)${uniSup('^j')} ${dv('C')}(${dv('n')}, ${dv('j')})(${dv('n')}${dop('−')}${dv('j')})${uniSup('^m')}`,
          N.surj.closed + (N.surj.overflow ? ' — the enumeration refuses at this size'
                                           : ', and ' + N.surj.enumerated + ' were built and counted')),
        drvSay('when m = n the three words collapse into one',
          'Between finite sets of the SAME size, injective and surjective are equivalent: ' + N.m + ' arrows landing apart must cover ' + N.m + ' targets, and covering ' + N.n + ' targets with ' + N.m + ' arrows leaves no room for a collision. That equivalence is why "one-to-one" and "onto" feel interchangeable in linear algebra — for a square matrix they are, and the rank–nullity theorem is this counting argument done in a vector space.'),
        drvSay('and it fails the moment the sets are infinite',
          'n ↦ n+1 on ℕ is injective and misses 0; n ↦ ⌊n/2⌋ is surjective and collides everywhere. Both are impossible between finite sets of equal size, and Dedekind turned that into the definition: a set is <b>infinite</b> exactly when it is in bijection with a proper part of itself. The countability stage is what that costs and what it buys.'),
        drvSay('why one is a product and the other an alternating sum',
          'Injections can be built greedily — choose where 1 goes, then where 2 goes from what is left — so the count is a product. Surjections cannot: "hits everything" is a condition on the whole map, not on one arrow at a time, so it is counted by removing the maps that miss something and adding back the ones removed twice. The sets stage draws exactly that correction.')
      ],
      note:'A bijection between finite sets forces m = n. That fails for infinite sets — which is the next stage, and the whole of what Cantor found.'
    };
  },
  readout(st){
    const N = this.cur(st), M = N.M;
    return `<div class="card tight"><div class="ttl">${esc(N.name)}</div>
      ${kv('injective', M.injective ? '<span style="color:var(--c-pos)">yes</span>'
           : '<span style="color:var(--c-neg)">no — ' + M.collision.a + ' and ' + M.collision.b +
             ' both map to ' + M.collision.at + '</span>')}
      ${kv('surjective', M.surjective ? '<span style="color:var(--c-pos)">yes</span>'
           : '<span style="color:var(--c-neg)">no — ' + M.missed.join(', ') + ' never occur</span>')}
      ${kv('bijective', M.bijective ? '<span style="color:var(--c-pos)">yes, so f has an inverse</span>' : 'no')}
      ${kv('targets actually hit', M.hit + ' of ' + N.n)}
      ${kv('pigeonhole', M.forcedCollision
           ? 'm > n, so no map at all could be injective'
           : 'm ≤ n, so counting alone forbids nothing')}
    </div>
    <div class="card tight"><div class="ttl">How many such maps exist</div>
      ${kv('all maps m → n', fmtSig(Math.pow(N.n, N.m), 12))}
      ${kv('injections, by the falling factorial', String(N.inj.closed))}
      ${kv('  the same, built one at a time', N.inj.overflow ? 'too many to enumerate here'
           : String(N.inj.enumerated) + (N.inj.agree ? ' — <span style="color:var(--c-pos)">identical</span>'
                                                     : ' — <span style="color:var(--c-neg)">they differ</span>'))}
      ${kv('surjections, by inclusion–exclusion', String(N.surj.closed))}
      ${kv('  the same, built one at a time', N.surj.overflow ? 'the enumeration refuses at this size'
           : String(N.surj.enumerated) + (N.surj.agree ? ' — <span style="color:var(--c-pos)">identical</span>'
                                                       : ' — <span style="color:var(--c-neg)">they differ</span>'))}
      <p class="help">When m = n the three counts collapse into one: a map between finite sets of equal
      size is injective exactly when it is surjective. That equivalence is the reason "one-to-one" and
      "onto" feel interchangeable in linear algebra — for a square matrix they are — and the reason
      they are not interchangeable anywhere infinite.</p>
    </div>
    ${N.why ? `<div class="card tight"><div class="ttl">About this map</div><p class="help">${N.why}</p></div>` : ''}`;
  },
  chip(st){
    const N = this.cur(st), M = N.M;
    return `<div class="k">${N.m} → ${N.n}</div>
      <div style="color:${M.bijective ? 'var(--c-pos)' : 'var(--c-dim)'}">${M.injective ? 'injective' : 'not injective'}</div>
      <div style="color:${M.surjective ? 'var(--c-pos)' : 'var(--c-dim)'}">${M.surjective ? 'surjective' : 'not surjective'}</div>`;
  },
  legend(){
    return [[rgbCss(TH.accent), 'an arrow of the map'],
            [rgbCss(TH.neg), 'two arrows colliding, or a target never hit'],
            [rgbCss(TH.pos), 'a target that is hit']];
  },
  dockLegend:true
};

/* ---- 3 · countability ----------------------------------------------------- */
STAGES.pfCount = {
  title:'Two constructions of Cantor’s, run',
  enter(st, o){
    st.mode = o.mode || 'pair';
    st.list = o.list || 'binaryCount';
    st.N = o.N === undefined ? 9 : o.N;
  },
  cur(st){
    const N = Math.max(4, Math.min(14, Math.round(st.N)));
    if(st.mode === 'pair') return { N, mode:'pair', P:pfPairCheck(N) };
    return { N, mode:'diag', D:pfDiagonal(st.list, N) };
  },
  controls(){
    const st = ST;
    return ctSeg('pfCtM', st.mode, [['pair', 'ℕ×ℕ is no bigger than ℕ'], ['diag', 'ℝ is bigger']]) +
      (st.mode === 'diag'
        ? ctSeg('pfCtL', st.list, Object.keys(PF_LISTS).map(k => [k, PF_LISTS[k].name]))
        : '') +
      ctlRow(st.mode === 'pair' ? 'show pairs up to' : 'rows of the list', ctlSlider('pfCtN', 4, 14, 1, st.N)) +
      (st.mode === 'pair'
        ? `<p class="help"><b>Every pair of whole numbers gets a number of its own</b>, by walking the
           diagonals: (0,0) is 0, then (1,0) and (0,1), then the next diagonal, and so on. The cell
           shows the index each pair receives. Nothing is skipped and nothing is used twice — the panel
           checks both, and also that unpairing an index returns the pair it came from.</p>
           <p class="help">This is why the rationals are countable: a fraction is a pair, so the list of
           pairs lists them all. "Infinite" is not one size, and this is the construction that shows the
           first two are the same size.</p>`
        : `<p class="help"><b>Any list of reals is incomplete, and here is the number it missed.</b>
           Read the digits down the diagonal, change every one of them, and the result differs from
           row k at digit k — so it is not row k, for any k. The changed digits are marked.</p>
           <p class="help">The digits avoid 0 and 9 deliberately. Without that care the constructed
           number could be a second decimal expansion of a number already listed (0.4999… = 0.5), which
           is the one real gap in the usual telling of this argument.</p>`);
  },
  wire(){
    ctWireSeg('pfCtM', v => { ST.mode = v; });
    ctWireSeg('pfCtL', v => { ST.list = v; });
    wireSlider('pfCtN', () => ST.N, v => { ST.N = Math.round(v); }, v => 'N = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const C = this.cur(st), n = C.N;
    const z = ctChipZone(ctx);
    const top = Math.max(42, z.h + 14);
    const B = ctFitBox(44, top, W - 88, H - top - 44);
    const side = Math.min(B.pw, B.ph);
    const cell = side / (n + 1);
    const gx = B.px + (B.pw - side) / 2, gy = B.py;
    if(C.mode === 'pair'){
      for(let i = 0; i <= n; i++)
        for(let j = 0; j <= n; j++){
          const k = pfPair(i, j);
          const d = i + j;
          const c = rampSeq(Math.min(1, d / (2 * n)));
          ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.30)';
          ctx.fillRect(gx + j * cell + 1, gy + i * cell + 1, cell - 2, cell - 2);
          if(cell >= 20)
            ctText(ctx, gx + (j + 0.5) * cell, gy + (i + 0.5) * cell, String(k),
                   rgbCss(TH.text), '10px ' + FONT_UI, 'center', 'middle');
        }
      /* the walk itself, drawn as the path the indices follow */
      ctx.strokeStyle = 'rgba(' + TH.accent[0] + ',' + TH.accent[1] + ',' + TH.accent[2] + ',0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      for(let d = 0; d <= 2 * n; d++)
        for(let j = 0; j <= d; j++){
          const i = d - j;
          if(i > n || j > n) continue;
          const X = gx + (j + 0.5) * cell, Y = gy + (i + 0.5) * cell;
          started ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), started = true);
        }
      ctx.stroke();
      ctText(ctx, gx - 8, gy + cell / 2, 'i', rgbCss(TH.text), '600 12px ' + FONT_UI, 'right', 'middle');
      ctText(ctx, gx + cell / 2, gy + side + 14, 'j', rgbCss(TH.text), '600 12px ' + FONT_UI, 'center', 'alphabetic');
      stageNote(ctx, C.P.bijection
        ? 'every index below ' + C.P.covered + ' appears exactly once, and every pair unpairs back to itself'
        : 'the pairing failed a check, which would be a defect', W, H);
      return;
    }
    /* the diagonal */
    const D = C.D;
    const cw = Math.min(34, (B.pw - 80) / n), ch = Math.min(26, (B.ph - 44) / (n + 2));
    /* centred, with the row labels' gutter guaranteed: left-aligned at a fixed
       40 px the matrix sat in the corner of a 1180 px canvas */
    const x0 = B.px + Math.max(40, (B.pw - n * cw) / 2), y0 = B.py + 8;
    D.rows.forEach((row, r) => {
      ctText(ctx, x0 - 8, y0 + (r + 0.5) * ch, 'r' + r, rgbCss(TH.faint), '10px ' + FONT_UI, 'right', 'middle');
      row.forEach((d, c) => {
        if(r === c){
          ctx.fillStyle = 'rgba(' + TH.accent[0] + ',' + TH.accent[1] + ',' + TH.accent[2] + ',0.28)';
          ctx.fillRect(x0 + c * cw, y0 + r * ch, cw, ch);
        }
        ctText(ctx, x0 + (c + 0.5) * cw, y0 + (r + 0.5) * ch, String(d),
               rgbCss(r === c ? TH.text : TH.dim), (r === c ? '600 11px ' : '11px ') + FONT_UI, 'center', 'middle');
      });
    });
    const dy = y0 + n * ch + 10;
    ctText(ctx, x0 - 8, dy + ch / 2, 'new', rgbCss(TH.pos), '600 10px ' + FONT_UI, 'right', 'middle');
    D.diag.forEach((d, c) => {
      ctx.fillStyle = 'rgba(' + TH.pos[0] + ',' + TH.pos[1] + ',' + TH.pos[2] + ',0.22)';
      ctx.fillRect(x0 + c * cw, dy, cw, ch);
      ctText(ctx, x0 + (c + 0.5) * cw, dy + ch / 2, String(d), rgbCss(TH.pos),
             '600 11px ' + FONT_UI, 'center', 'middle');
    });
    stageNote(ctx, D.allDiffer
      ? 'the new row differs from every one of the ' + n + ' rows, at the marked digit'
      : 'a row matched, which cannot happen', W, H);
  },
  derive(st){
    const C = this.cur(st);
    if(C.mode === 'pair'){
      const P = C.P;
      return {
        title:'Why ℕ×ℕ is not bigger than ℕ',
        steps:[
          drvSay('“the same size” has to be defined before it can be argued about',
            'Two sets have the same size when a bijection exists between them. For finite sets that agrees with counting. For infinite sets it is the definition, and it has consequences people find intolerable until they accept that no other definition works any better.'),
          drvStep('the pairing function, written down',
            `${dv('π')}(${dv('i')}, ${dv('j')}) ${dop('=')} ${dfrac('(' + dv('i') + '+' + dv('j') + ')(' + dv('i') + '+' + dv('j') + '+1)', '2')} ${dop('+')} ${dv('j')}`,
            'π(0,0) = 0, π(1,0) = 1, π(0,1) = 2, π(2,0) = 3 — the diagonals, in order'),
          drvStep('injective: no index is used twice',
            `${dv('π')}(${dv('i')},${dv('j')}) ${dop('=')} ${dv('π')}(${dv('a')},${dv('b')}) ${dop('⟹')} (${dv('i')},${dv('j')}) ${dop('=')} (${dv('a')},${dv('b')})`,
            P.injective ? 'checked over ' + ((C.N + 1) * (C.N + 1)) + ' pairs — no repeat'
                        : 'a repeat was found, which would be a defect'),
          drvStep('surjective: no index is skipped',
            `${dop('every')} ${dv('k')} ${dop('<')} ${P.covered} ${dop('is hit')}`,
            P.gaps === 0 ? 'no gaps below ' + P.covered : P.gaps + ' gaps'),
          drvStep('and the inverse, computed rather than asserted',
            `${dv('w')} ${dop('=')} ${dop('⌊')}(${dop('√')}(8${dv('k')}${dop('+')}1) ${dop('−')} 1)/2${dop('⌋')}`,
            P.roundTrip ? 'every pair survives the round trip' : 'the round trip failed somewhere'),
          drvSay('so the rationals are countable',
            'A positive rational is a pair of whole numbers, so the pairing gives every fraction an index — several indices, in fact, since 1/2 and 2/4 are different pairs, and having too many is harmless. A set no bigger than a countable set is countable.'),
          drvSay('and an injection is all you ever have to produce',
            'Nobody builds an explicit bijection ℕ → ℚ. You give an injection ℚ → ℕ, note the obvious injection ℕ → ℚ, and appeal to Schröder–Bernstein, which turns two injections into a bijection without constructing either. That is why "countable" is easy to prove in practice and why the diagonal argument in the other mode has to be so careful: proving something is NOT countable cannot be done by failing to find a list.'),
          drvSay('the same trick nests, and that is what makes it worth having',
            'ℕ³ is ℕ × (ℕ × ℕ), so pair twice. Any finite product of countable sets is countable; so is a countable union of them, by pairing "which set" with "which element". That is how the algebraic numbers — every root of every polynomial with whole-number coefficients, which includes √2, the golden ratio and every constructible length — turn out to be countable, and therefore why almost every real number is transcendental. Cantor proved transcendentals exist by counting, years before anyone exhibited one.')
        ],
        note:'The same trick nests: ℕ³ is ℕ×(ℕ×ℕ), pair twice. Any finite product of countable sets is countable, and so is a countable union of them.'
      };
    }
    const D = C.D;
    return {
      title:'Why no list of reals can be complete',
      steps:[
        drvSay('suppose someone hands you a list',
          'Not a particular list — ANY list, given as a rule that produces row k for each k. The argument must work against every possible list, and it does, because it only uses that the rows are indexed.'),
        drvStep('read the diagonal',
          `${dv('d')}ₖ ${dop('=')} ${dop('digit')} ${dv('k')} ${dop('of row')} ${dv('k')}`,
          'the shaded cells: ' + D.rows.map((r, i) => r[i]).slice(0, 10).join(', ') + (C.N > 10 ? ' …' : '')),
        drvStep('and change every digit of it',
          `${dv('e')}ₖ ${dop('≠')} ${dv('d')}ₖ`,
          'the new row: ' + D.diag.slice(0, 10).join(', ') + (C.N > 10 ? ' …' : '')),
        drvStep('the number that builds is on no row of the list',
          `${dv('e')} ${dop('≠')} ${dop('row')} ${dv('k')} ${dop('for every')} ${dv('k')}`,
          D.allDiffer ? 'checked against all ' + C.N + ' rows — it differs from row k at digit k, every time'
                      : 'a row matched, which cannot happen'),
        drvSay('the care that is usually skipped',
          'In base ten 0.4999… and 0.5000… are the same number, so a constructed number could coincide with a listed one despite differing in every digit. Avoiding 0 and 9 in the construction rules that out — and the panel does avoid them, which you can check in the bottom row.'),
        drvSay('what it does and does not prove',
          'It does not say the reals are "uncountable" by counting them. It says: no surjection ℕ → ℝ exists, because any candidate is handed a number it misses. Both this and the pairing argument are constructions, and neither needs a single new axiom.')
      ],
      note:'The same argument shows a set is never in bijection with its own power set — which is Cantor’s theorem, and the reason there is no largest infinity.'
    };
  },
  readout(st){
    const C = this.cur(st);
    if(C.mode === 'pair'){
      const P = C.P;
      return `<div class="card tight"><div class="ttl">Cantor’s pairing, over pairs up to ${C.N}</div>
        ${kv('pairs checked', ((C.N + 1) * (C.N + 1)))}
        ${kv('indices covered without a gap', P.gaps === 0 ? 'all ' + P.covered + ' below the triangular bound'
             : '<span style="color:var(--c-neg)">' + P.gaps + ' gaps</span>')}
        ${kv('any index used twice?', P.injective ? 'none' : '<span style="color:var(--c-neg)">yes</span>')}
        ${kv('unpair(pair(i, j)) = (i, j)', P.roundTrip ? '<span style="color:var(--c-pos)">every time</span>'
             : '<span style="color:var(--c-neg)">not always</span>')}
        ${kv('so π is', P.bijection ? '<span style="color:var(--c-pos)">a bijection ℕ×ℕ → ℕ</span>'
             : '<span style="color:var(--c-neg)">not a bijection, which would be a defect</span>')}
        ${kv('largest index in this block', String(P.maxK))}
        <p class="help">Two routes, and they ask different questions: the round trip tests the formula
        against its own inverse, while the gap count tests the image against the whole of ℕ. A formula
        can pass the first and fail the second — that is exactly what an injection that is not onto
        does — so both are needed.</p>
      </div>`;
    }
    const D = C.D;
    return `<div class="card tight"><div class="ttl">${esc(D.list.name)}</div>
      ${kv('rows of the list', String(C.N))}
      ${kv('the constructed number', '0.' + D.diag.join('') + '…')}
      ${kv('as a value', fmtSig(D.value, 10) + ' in base ' + D.list.base)}
      ${kv('differs from every row?', D.allDiffer ? '<span style="color:var(--c-pos)">yes — from row k at digit k, all ' + C.N + ' of them</span>'
           : '<span style="color:var(--c-neg)">no, which cannot happen</span>')}
      ${kv('digits 0 or 9 used', D.list.base === 10
           ? (D.diag.some(d => d === 0 || d === 9) ? '<span style="color:var(--c-neg)">yes — the two-expansion gap is open</span>'
                                                   : 'none, so the two-expansion objection does not apply')
           : 'not applicable in base 2')}
      <p class="help">${D.list.why}</p>
    </div>`;
  },
  chip(st){
    const C = this.cur(st);
    if(C.mode === 'pair')
      return `<div class="k">ℕ×ℕ → ℕ</div>
        <div style="color:${C.P.bijection ? 'var(--c-pos)' : 'var(--c-neg)'}">${C.P.bijection ? 'a bijection' : 'check failed'}</div>
        <div style="color:var(--c-dim)">${C.P.covered} indices, no gaps</div>`;
    return `<div class="k">the diagonal</div>
      <div style="color:${C.D.allDiffer ? 'var(--c-pos)' : 'var(--c-neg)'}">${C.D.allDiffer ? 'on no row' : 'check failed'}</div>
      <div style="color:var(--c-dim)">0.${C.D.diag.slice(0, 6).join('')}…</div>`;
  },
  /* the legend has to key on the mode: the same fixed key over two different
     pictures is a caption for the other diagram */
  legend(st){
    const C = this.cur(st);
    if(C.mode === 'pair')
      return [[rgbCss(TH.accent), 'the walk: diagonal by diagonal'],
              [rgbCss(TH.mid), 'later diagonals, further from the origin']];
    return [[rgbCss(TH.accent), 'the diagonal digit of each row'],
            [rgbCss(TH.pos), 'the constructed number, changed at every one']];
  },
  dockLegend:true
};
