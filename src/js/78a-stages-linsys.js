/* ============================================================================
   4m · SYSTEMS OF LINEAR EQUATIONS — elimination you can watch and edit
   Every matrix on this floor is typed by the reader. Nothing is hard-coded, so
   the elimination transcript, the rank, the solution set and the picture are
   always describing the matrix actually on screen.
   ============================================================================ */

/* a few systems worth starting from, each making a different point */
const LS_PRESETS = {
  unique:   { M:[[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]], n:'one solution' },
  none:     { M:[[1,1,1,2],[2,2,2,5],[1,-1,0,0]],       n:'no solution' },
  many:     { M:[[1,2,-1,3],[2,4,1,9],[3,6,2,14]],      n:'infinitely many' },
  twoLines: { M:[[1,-1,1],[1,1,3]],                     n:'two lines, 2 unknowns' },
  parallel: { M:[[1,-1,1],[2,-2,5]],                    n:'parallel lines' }
};

STAGES.laSystem = {
  title:'Elimination, step by step',
  derive(st){
    const cols = st.M[0].length - 1;
    /* laRREF reports pivots and rank; only laSolve decides consistency, because
       a pivot in the augmented column is what makes a system unsolvable. */
    const S = laSolve(st.M.map(r => r.slice(0, cols)), st.M.map(r => r[cols]));
    const R = { rank:S.rank };
    return {
      title:'Elimination is a sequence of reversible moves, which is why it is allowed',
      steps:[
        drvSay('the one thing that must never change',
          'Every step replaces the system with a different-looking one. The method depends entirely on the new system having exactly the same solutions as the old — not approximately, not usually, but exactly. Three moves have that property, and no others are used.'),
        drvStep('swap two rows',
          `${dv('R')}ᵢ ${dop('↔')} ${dv('R')}ⱼ`,
          'the order in which the equations are written cannot matter'),
        drvStep('scale a row by a nonzero number',
          `${dv('R')}ᵢ ${dop('→')} ${dv('c')}${dv('R')}ᵢ , ${dv('c')} ${dop('≠')} 0`,
          'nonzero is essential — multiplying by zero discards an equation and gains solutions'),
        drvStep('add a multiple of one row to another',
          `${dv('R')}ᵢ ${dop('→')} ${dv('R')}ᵢ ${dop('+')} ${dv('c')}${dv('R')}ⱼ`,
          'anything satisfying both satisfies the combination, and subtracting undoes it'),
        drvSay('each is invertible, and that is the whole justification',
          'Because every move is undone by another move of the same kind, no solution is created and none destroyed. The system at the end has the same solution set as the one at the start — which is why the answer read off the final matrix answers the original problem.'),
        drvStep('drive to reduced row echelon form',
          `a leading 1 in each pivot row, zeros above and below it`,
          `rank ${R.rank}, with ${cols} unknowns`),
        drvSay('and the shape of that form answers everything at once',
          'A pivot in the augmented column means a row reading 0 = 1, so there is no solution. Otherwise each column without a pivot is a free variable, and the count of them is the dimension of the solution set. One answer, infinitely many, or none — decided by counting pivots rather than by inspection.'),
        drvStep('so the three outcomes are read off directly',
            `pivots ${dop('=')} unknowns ${dop('⇒')} unique solution`,
            S.kind === 'none' ? 'inconsistent — a pivot sits in the augmented column, giving a row 0 = 1'
              : (S.kind === 'unique' ? `a unique solution, rank ${S.rank} = ${cols} unknowns`
                 : `${S.nullity} free variable(s), so infinitely many solutions`)),
        drvSay('the geometry is the same statement in pictures',
          'Each equation in two unknowns is a line, in three a plane. A unique solution is a single crossing; infinitely many is a shared line or plane; none is a parallel arrangement that never meets. Elimination is that geometry carried out in arithmetic.')
      ],
      note:'The panel keeps the full transcript of row operations, so every step can be replayed. Nothing is solved by a black box — the reduced matrix shown is the result of the listed operations applied in order.'
    };
  },
  enter(st, o){
    st.preset = LS_PRESETS[o.preset] ? o.preset : 'unique';
    const p = LS_PRESETS[st.preset];
    st.M = mxClone(p.M);
    st.step = -1;              // -1 = show the original
    st.showGeom = o.geom !== false;
    this.solve(st);
  },
  solve(st){
    st.res = laRREF(st.M);
    const A = st.M.map(r => r.slice(0, r.length - 1));
    const b = st.M.map(r => r[r.length - 1]);
    st.sol = laSolve(A, b);
    st.A = A; st.b = b;
    st.step = Math.min(st.step, st.res.steps.length - 1);
  },
  controls(){
    const st = ST;
    const cols = st.M[0].length;
    const lbl = Array.from({ length:cols }, (_, j) =>
      j === cols - 1 ? '=' : ['x', 'y', 'z', 'w'][j] || ('x' + (j + 1)));
    /* The picker shows which system is loaded, rather than nothing at all.
       These presets are not all the same SHAPE — two lines in two unknowns
       against three planes in three — so this control, and only this control,
       decides how many cells the editor has. A permalink can restore a cell it
       can find; it cannot conjure a fourth column. Marking the choice is what
       lets a link to a typed 3×4 system come back as a 3×4 system.
       It reads as the system this one started from: editing a cell afterwards
       leaves the highlight where it was, which is also where the shape came
       from. */
    return ctSeg('lsP', st.preset, Object.keys(LS_PRESETS).map(k => [k, LS_PRESETS[k].n])) +
      mxHtml('lsM', st.M, null, lbl) +
      `<div class="row wrap">${ctBtn('lsPrev', '◀ step')}${ctBtn('lsNext', 'step ▶')}
        ${ctBtn('lsAll', 'run it all')}${ctBtn('lsRe', 'reset')}
        <span class="val">${st.step + 1} / ${st.res.steps.length}</span></div>
      ${ctChk('lsG', 'draw the equations', st.showGeom)}
      <p class="help">Type into any cell — the elimination, the rank and the picture all follow
      immediately. The last column is the right-hand side. <b>Row reduction is the whole first half
      of the subject</b>, and every step here is one of exactly three moves: swap two rows, scale a
      row, or subtract a multiple of one row from another. None of them changes the solution set,
      which is the reason the method is allowed to exist.</p>`;
  },
  wire(){
    ctWireSeg('lsP', v => { ST.preset = v; ST.M = mxClone(LS_PRESETS[v].M); ST.step = -1; STAGES.laSystem.solve(ST); });
    mxWire('lsM', (i, j, v) => { ST.M[i][j] = v; STAGES.laSystem.solve(ST); });
    ctWireBtn('lsPrev', () => { ST.step = Math.max(-1, ST.step - 1); });
    ctWireBtn('lsNext', () => { ST.step = Math.min(ST.res.steps.length - 1, ST.step + 1); });
    ctWireBtn('lsAll',  () => { ST.step = ST.res.steps.length - 1; });
    ctWireBtn('lsRe',   () => { ST.step = -1; });
    ctWireChk('lsG', v => { ST.showGeom = v; });
  },
  frame(st, dt, ctx, W, H){
    const cur = st.step < 0 ? st.M : st.res.steps[st.step].M;
    const nUnk = st.M[0].length - 1;
    /* left: the matrix as a grid of numbers, the changed row highlighted.
       y0 clears the readout chip. The chip floats over the canvas's top-left
       corner — about 180 wide and, with this stage's three lines, about 100
       tall — and at the old y0 = 70 it sat squarely on top of the heading and
       the first column of every matrix. That is the trap documented in
       src/js/CLAUDE.md, and the block simply has to start below it. */
    const cw = 74, chh = 30;
    const x0 = 60, y0 = 148;
    ctx.font = '600 12px ' + FONT_UI; ctx.fillStyle = rgbCss(TH.dim);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(st.step < 0 ? 'the augmented matrix as typed'
                             : st.res.steps[st.step].text, x0, y0 - 22);
    const hot = st.step < 0 ? -1 : st.res.steps[st.step].a;
    for(let i = 0; i < cur.length; i++){
      if(i === hot){
        ctx.fillStyle = rgbCss(TH.warn, 0.16);
        ctx.fillRect(x0 - 8, y0 + i * chh - 19, cw * cur[0].length + 16, chh - 4);
      }
      for(let j = 0; j < cur[0].length; j++){
        const piv = st.res.pivots.indexOf(j) === i && st.step >= 0;
        ctx.fillStyle = j === cur[0].length - 1 ? rgbCss(TH.curl)
                      : piv ? rgbCss(TH.grad) : rgbCss(TH.text);
        ctx.font = (piv ? '700 ' : '') + '13px ' + FONT_MONO;
        ctx.textAlign = 'right';
        ctx.fillText(fmtNum(cur[i][j], 4), x0 + j * cw + cw - 14, y0 + i * chh);
      }
      /* the bar separating A from b */
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      const bx = x0 + (cur[0].length - 1) * cw - 8;
      ctx.beginPath(); ctx.moveTo(bx, y0 - 20); ctx.lineTo(bx, y0 + cur.length * chh - 16); ctx.stroke();
    }
    /* right: the equations drawn, when there are two unknowns */
    if(st.showGeom && nUnk === 2){
      const px = x0 + cur[0].length * cw + 60;
      const side = Math.min(W - px - 40, H - 150);
      if(side > 120){
        /* the plot is far enough right to clear the chip, so it keeps its own top */
        const P = mkPlot(px, 64, side, side, -6, 6, -6, 6);
        plotFrame(ctx, P, 'x', 'y', 'each equation is a line — a solution is a common point');
        ctGrid(ctx, P);
        const cols = [TH.grad, TH.curl, TH.pos, TH.neg];
        st.M.forEach((r, i) => {
          const [a, bb, c] = r;
          const col = rgbCss(cols[i % 4]);
          if(Math.abs(bb) > 1e-9) plotCurve(ctx, P, x => (c - a * x) / bb, 2, col, 2.4);
          else if(Math.abs(a) > 1e-9){
            const xv = c / a;
            ctPath(ctx, P, [{ x:xv, y:P.y0 }, { x:xv, y:P.y1 }], col, 2.4);
          }
        });
        if(st.sol.kind === 'unique'){
          ctDot(ctx, P, st.sol.x[0], st.sol.x[1], 6, rgbCss(TH.warn), rgbCss(TH.bg));
        }
      }
    } else if(st.showGeom && nUnk === 3){
      ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11.5px ' + FONT_UI; ctx.textAlign = 'left';
      ctx.fillText('three unknowns: each equation is a plane. The solution set is their intersection —',
                   x0, y0 + cur.length * chh + 34);
      ctx.fillText('a point, a line, a plane, or nothing at all, exactly as the rank says below.',
                   x0, y0 + cur.length * chh + 52);
    }
    stageNote(ctx, 'green entries are pivots · purple is the right-hand side · the highlighted row is the one that just changed', W, H);
  },
  readout(st){
    const nUnk = st.M[0].length - 1;
    const s = st.sol;
    const verdict = s.kind === 'unique' ? 'exactly one solution'
                  : s.kind === 'none'   ? '<b>no solution</b> — the rows contradict each other'
                  : `<b>infinitely many</b> — ${s.nullity} free ${s.nullity === 1 ? 'variable' : 'variables'}`;
    return `<div class="card tight"><div class="ttl">What the elimination found</div>
      ${kv('unknowns', nUnk)}
      ${kv('rank of A', s.rank)}
      ${kv('nullity (free variables)', nUnk - s.rank)}
      ${kv('rank + nullity', s.rank + (nUnk - s.rank) + ' = ' + nUnk)}
      ${kv('verdict', verdict)}
      ${s.x ? kv('a solution', '⟨' + s.x.map(v => fmtNum(v, 4)).join(', ') + '⟩') : ''}
      <p class="help">Rank counts the independent equations. Nullity counts the directions the
      solution is free to move in. They always add to the number of unknowns — that is the
      rank–nullity theorem, and it is visible here as a bookkeeping identity rather than a
      quoted result.</p>
    </div>
    ${s.x ? `<div class="card tight"><div class="ttl">Substituted back</div>
      ${st.A.map((row, i) => kv('row ' + (i + 1),
        fmtNum(laDot(row, s.x), 6) + '  vs  ' + fmtNum(st.b[i], 6))).join('')}
      ${kv('largest residual', fmtGap(Math.max(...st.A.map((row, i) => Math.abs(laDot(row, s.x) - st.b[i]))),
                                      Math.max(1e-300, ...st.b.map(Math.abs))))}
      <p class="help">The solution is put back into the original equations, not the reduced ones.
      A method that produced the answer cannot also be the thing that checks it.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">The three legal moves</div>
      ${kv('swaps used', st.res.swaps)}
      ${kv('total steps', st.res.steps.length)}
      <p class="help">Swap, scale by a nonzero number, and add a multiple of one row to another.
      Each is invertible, which is exactly why the solution set survives them — and it is why
      elimination is a proof and not merely a procedure.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">elimination</div><div>step ${st.step + 1} of ${st.res.steps.length}</div>
      <div style="color:var(--c-grad)">rank ${st.sol.rank}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'pivot entries'], ['var(--c-curl)', 'right-hand side'],
                    ['var(--c-warn)', 'the row that just changed']]; },
  dockLegend:true
};

/* ---- 2 · matrix arithmetic, inverses and block structure ------------------ */
STAGES.laMatOps = {
  title:'Matrix arithmetic',
  derive(st){
    return {
      title:'Why matrix multiplication has the definition it has',
      steps:[
        drvSay('the definition looks arbitrary and is not',
          '"Rows times columns" is presented to most students as a rule to memorise, and it looks perverse next to addition, which is done entrywise. Multiplication is not entrywise because matrices are not really arrays of numbers — they are functions, and multiplying them has to mean composing those functions.'),
        drvStep('a matrix is a linear map',
          `${dv('A')}${dv('x')} ${dop('=')} the vector ${dv('x')} is sent to`,
          'the columns of A are precisely the images of the basis vectors'),
        drvSay('that last fact is worth pausing on',
          'Feed A the vector (1, 0) and the answer is its first column. Feed it (0, 1) and you get the second. So a matrix is nothing more than a list of where the basis vectors go — and because the map is linear, knowing that determines it everywhere.'),
        drvStep('now apply one map after another',
          `(${dv('A')}${dv('B')})${dv('x')} ${dop('=')} ${dv('A')}(${dv('B')}${dv('x')})`,
          'the product must be whatever matrix does B first, then A'),
        drvStep('work out where the basis vectors go under that combination',
          `column ${dv('j')} of ${dv('A')}${dv('B')} ${dop('=')} ${dv('A')} ${dop('×')} (column ${dv('j')} of ${dv('B')})`,
          'and expanding that product is exactly the row-times-column rule'),
        drvSay('so the rule is derived, not decreed',
          'Rows dot columns is what falls out of demanding that AB mean "do B, then A". Every strange feature of matrix multiplication follows from this and stops being strange.'),
        drvStep('composition is associative, so multiplication is',
          `(${dv('A')}${dv('B')})${dv('C')} ${dop('=')} ${dv('A')}(${dv('B')}${dv('C')})`,
          'doing three things in order does not depend on how you bracket them'),
        drvStep('but composition is not commutative, so multiplication is not',
          `${dv('A')}${dv('B')} ${dop('≠')} ${dv('B')}${dv('A')}`,
          'the panel computes both products and their difference'),
        drvSay('and the non-commutativity is physical, not a defect',
          'Rotate a book about one axis then another, and the result depends on the order — try it. Matrices refuse to commute because the transformations they describe genuinely do not commute. In quantum mechanics the same failure is the uncertainty principle: position and momentum are operators whose commutator is not zero, and that is why they cannot be measured together.')
      ],
      note:'The dimensions must match for the product to exist at all — the inner dimensions agree because the output of B has to be something A can accept. That constraint is not bookkeeping either; it is the statement that the codomain of one map is the domain of the next.'
    };
  },
  enter(st, o){
    st.A = o.A ? mxClone(o.A) : [[2, 1], [1, 3]];
    st.B = o.B ? mxClone(o.B) : [[1, -1], [0, 2]];
    st.op = o.op || 'mul';
  },
  controls(){
    const st = ST;
    return ctSeg('moOp', st.op, [['mul', 'A B'], ['inv', 'A⁻¹'], ['pow', 'Aⁿ'], ['block', 'block form']]) +
      `<div class="row wrap" style="gap:22px;align-items:flex-start">
        <div><div class="ttl">A</div>${mxHtml('moA', st.A)}</div>
        <div><div class="ttl">B</div>${mxHtml('moB', st.B)}</div>
      </div>
      <p class="help">${st.op === 'mul'
        ? 'Matrix multiplication is <b>composition of the two maps</b>, which is the whole reason for its strange-looking rule: entry (i,j) of AB is row i of A dotted with column j of B. It is associative but <b>not</b> commutative — the panel computes AB and BA and prints their difference, which is almost never zero.'
        : st.op === 'inv'
        ? 'The inverse undoes the map. It exists exactly when the determinant is nonzero, equivalently when elimination reaches a pivot in every column. The panel multiplies A by its inverse and prints the worst entry of the difference from I.'
        : st.op === 'pow'
        ? 'Repeated application. If A is diagonalisable, Aⁿ = P Dⁿ P⁻¹ and the behaviour is decided entirely by the eigenvalues: those with |λ| &gt; 1 grow, those with |λ| &lt; 1 die. That is why the eigenvalue wing exists.'
        : 'A block matrix is a matrix whose entries are matrices. Multiplication works block by block <i>provided the shapes match</i> — which is why block form is the standard way to prove things about big matrices without drowning in indices.'}</p>`;
  },
  wire(){
    ctWireSeg('moOp', v => { ST.op = v; });
    mxWire('moA', (i, j, v) => { ST.A[i][j] = v; });
    mxWire('moB', (i, j, v) => { ST.B[i][j] = v; });
  },
  frame(st, dt, ctx, W, H){
    /* the unit square and its images: multiplication seen as composition */
    /* Three boxes, two 50px gaps and a 60px left margin: the width available for
       each is (W − 160)/3, not W/3 − 40. The old figure was forty pixels too
       generous per box, so the third one always hung off the right-hand edge —
       by exactly the amount that made its "e₂↦" label disappear. */
    const side = Math.max(60, Math.min((W - 170) / 3, H - 150));
    const boxes = [['A', st.A, TH.grad], ['B', st.B, TH.curl], ['A B', laMul(st.A, st.B), TH.warn]];
    boxes.forEach(([name, M, col], k) => {
      const P = mkPlot(60 + k * (side + 50), 70, side, side, -4, 4, -4, 4);
      plotFrame(ctx, P, null, null, name + ' applied to the unit square');
      ctGrid(ctx, P);
      const sq = [[0,0],[1,0],[1,1],[0,1]];
      ctFill(ctx, P, sq.map(p => ({ x:p[0], y:p[1] })), rgbCss(TH.faint, 0.18));
      const img = sq.map(p => { const q = laMatVec(M, p); return { x:q[0], y:q[1] }; });
      ctFill(ctx, P, img, rgbCss(col, 0.3));
      ctPath(ctx, P, img.concat([img[0]]), rgbCss(col), 2.2);
      ctArrow(ctx, P, 0, 0, M[0][0], M[1][0], rgbCss(TH.pos), 2, 'e₁↦');
      ctArrow(ctx, P, 0, 0, M[0][1], M[1][1], rgbCss(TH.neg), 2, 'e₂↦');
    });
    stageNote(ctx, 'the columns of a matrix are the images of the basis vectors — that is all a matrix is', W, H);
  },
  readout(st){
    const AB = laMul(st.A, st.B), BA = laMul(st.B, st.A);
    const Ai = laInv(st.A);
    const show = M => ctMat(M);
    return `<div class="card tight"><div class="ttl">A B  and  B A</div>
      ${show(AB)}
      ${kv('det A · det B', fmtNum(laDet(st.A) * laDet(st.B), 6))}
      ${kv('det (A B)', fmtNum(laDet(AB), 6))}
      ${kv('largest |AB − BA|', fmtNum(laMaxDiff(AB, BA), 4))}
      <p class="help">The determinant is multiplicative — areas scale by one factor then the other —
      but the product itself is not commutative, and the last row is how far from commuting these
      two happen to be.</p>
    </div>
    <div class="card tight"><div class="ttl">A⁻¹</div>
      ${Ai ? show(Ai) + kv('largest |A A⁻¹ − I|', fmtNum(laMaxDiff(laMul(st.A, Ai), laId(st.A.length)), 3))
           : '<p class="help"><b>A is singular</b> — det A = 0, the columns are dependent, and the map collapses the square onto a line. Nothing can undo that.</p>'}
      ${kv('det A', fmtNum(laDet(st.A), 6))}
      ${kv('rank A', laRank(st.A))}
    </div>`;
  },
  chip(st){
    return `<div class="k">matrix</div><div>det A = ${fmtNum(laDet(st.A), 4)}</div>
      <div style="color:var(--c-grad)">rank ${laRank(st.A)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'A'], ['var(--c-curl)', 'B'], ['var(--c-warn)', 'the composite A B'],
                    ['var(--c-pos)', 'image of e₁'], ['var(--c-neg)', 'image of e₂']]; },
  dockLegend:true
};
