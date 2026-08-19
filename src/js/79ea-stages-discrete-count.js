/* ============================================================================
   7ea · COUNTING — the stages  (Programme C wing C5)

     dcCount  the four counting problems, with the objects actually drawn
     dcBirth  the birthday problem: a ratio of two of those four, and a sim

   The picture in dcCount is the whole argument. Every object the formula claims
   to count is built, drawn, and counted — so a reader who does not believe
   C(6,3) = 20 can count twenty rows. That is not a check on the formula in the
   numerical sense; it is the definition, and the formula is the shortcut.
   ============================================================================ */

/* the enumeration is drawn, so the cap here is what fits on a canvas rather
   than what fits in memory: 400 rows is already unreadable */
const DC_DRAW_CAP = 400;

STAGES.dcCount = {
  title:'The four counting problems',
  enter(st, o){
    st.kind = o.kind || 'comb';
    st.n = o.n === undefined ? 5 : o.n;
    st.k = o.k === undefined ? 3 : o.k;
  },
  cur(st){
    const n = Math.max(1, Math.min(9, Math.round(st.n)));
    const k = Math.max(0, Math.min(9, Math.round(st.k)));
    const C = dcCountCheck(st.kind, n, k, DC_DRAW_CAP);
    return { n, k, C, K:DC_KINDS[st.kind] };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('dcCnK', st.kind, Object.keys(DC_KINDS).map(k => [k, DC_KINDS[k].sym])) +
      ctlRow('how many to choose from, n', ctlSlider('dcCnN', 1, 9, 1, st.n)) +
      ctlRow('how many to choose, k', ctlSlider('dcCnKk', 0, 9, 1, st.k)) +
      `<p class="help"><b>${DC_KINDS[st.kind].name}.</b> Every object is drawn below, one per row,
      and the panel counts the rows. The closed form is printed beside that count and the two are
      compared — which makes this the rare place in mathematics where the second route is not an
      approximation to the answer but <i>is</i> the answer, obtained straight from the definition.</p>
      <p class="help">The whole of elementary counting is a two-by-two table: does order matter, and
      may things repeat. Step through the four buttons at one setting of n and k and watch the count
      change by exactly the factor the fourth row of the readout names. Nothing else is going on.</p>
      ${N.C.overflow ? `<p class="help" style="color:var(--c-warn)">More than ${DC_DRAW_CAP} objects
      — too many to draw, so the enumeration refuses rather than showing you part of a list and
      calling it the answer. The closed form still applies; lower n or k to see the objects again.</p>` : ''}`;
  },
  wire(){
    ctWireSeg('dcCnK', v => { ST.kind = v; });
    wireSlider('dcCnN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('dcCnKk', () => ST.k, v => { ST.k = Math.round(v); }, v => 'k = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), C = N.C;
    const z = ctChipZone(ctx);
    const top = Math.max(40, z.h + 10);
    const B = ctFitBox(30, top, W - 60, H - top - 46);
    /* k = 0 is NOT an empty list — it is a list of one object, and that object
       is the empty choice. `!C.list.length` is therefore false there, and the
       drawing path below read obj[0] of an empty array, handed NaN to rampSeq,
       and threw on the colour it got back. Which is the whole point of the
       demo: there is exactly one way to choose nothing, and the picture has to
       say so rather than fall over on it. Found by runall. */
    if(C.overflow || !C.list.length || N.k === 0){
      ctText(ctx, B.px + B.pw / 2, B.py + B.ph / 2,
             C.overflow ? fmtNum(C.closed, 9) + ' objects — too many to draw'
                        : (N.k === 0 ? 'exactly one object: the empty choice' : 'no objects at all'),
             rgbCss(TH.dim), '14px ' + FONT_UI, 'center', 'middle');
      if(!C.overflow && N.k === 0)
        ctText(ctx, B.px + B.pw / 2, B.py + B.ph / 2 + 22,
               'which is why 0! = 1 and C(n, 0) = 1 — there is one way to choose nothing',
               rgbCss(TH.faint), '11px ' + FONT_UI, 'center', 'middle');
      stageNote(ctx, 'closed form ' + fmtNum(C.closed, 9), W, H);
      return;
    }
    /* lay the objects out in columns that fit, each object a row of k cells
       naming the chosen elements; the cell colour is the element, so a repeat
       is visible as a repeated colour rather than as a repeated numeral */
    const m = C.list.length, kk = Math.max(1, N.k);
    const cellW = 15, cellH = 13, gapY = 3, gapX = 16;
    const objW = kk * cellW + gapX;
    const perCol = Math.max(1, Math.floor(B.ph / (cellH + gapY)));
    const cols = Math.ceil(m / perCol);
    const totalW = cols * objW;
    const sx = B.px + Math.max(0, (B.pw - totalW) / 2);
    const scale = totalW > B.pw ? B.pw / totalW : 1;
    ctx.save();
    ctx.translate(sx, B.py);
    if(scale < 1) ctx.scale(scale, 1);
    C.list.forEach((obj, i) => {
      const col = Math.floor(i / perCol), row = i % perCol;
      const x0 = col * objW, y0 = row * (cellH + gapY);
      for(let j = 0; j < kk; j++){
        const e = obj[j];
        const t = N.n > 1 ? e / (N.n - 1) : 0;
        const c = rampSeq(t);
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.75)';
        ctx.fillRect(x0 + j * cellW, y0, cellW - 2, cellH - 1);
        ctx.fillStyle = rgbCss(TH.bg);
        ctx.font = '9px ' + FONT_UI;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String.fromCharCode(65 + e), x0 + j * cellW + (cellW - 2) / 2, y0 + cellH / 2);
      }
    });
    ctx.restore();
    stageNote(ctx, C.enumerated + ' objects drawn   ·   closed form ' + fmtNum(C.closed, 9) +
              '   ·   ' + (C.agree ? 'they agree' : 'THEY DISAGREE'), W, H);
  },
  derive(st){
    const N = this.cur(st), C = N.C, n = N.n, k = N.k;
    return {
      title:'Where the four formulas come from',
      steps:[
        drvSay('every one of them is the multiplication principle, applied and then corrected',
          'Make the choice in stages. If stage one has a ways and stage two has b ways <em>whatever</em> stage one gave, the pair has ab ways. That single sentence generates all four rows below; the differences are only in what has to be divided out afterwards.'),
        drvStep('order matters, repeats allowed — nothing to correct',
          `${dv('n')} ${dop('×')} ${dv('n')} ${dop('×')} … ${dop('=')} ${dv('n')}${uniSup('^k')}`,
          fmtNum(Math.pow(n, k), 9) + ' — each of the k places is filled independently'),
        drvStep('order matters, no repeats — the pool shrinks',
          `${dv('n')}(${dv('n')}${dop('−')}1)…(${dv('n')}${dop('−')}${dv('k')}${dop('+')}1) ${dop('=')} ${dfrac(dv('n') + '!', '(' + dv('n') + '−' + dv('k') + ')!')}`,
          fmtNum(dcPerm(n, k), 9)),
        drvStep('order does NOT matter — divide by the orderings of one choice',
          `${dfrac(dv('P') + '(' + dv('n') + ', ' + dv('k') + ')', dv('k') + '!')} ${dop('=')} ${dfrac(dv('n') + '!', dv('k') + '!(' + dv('n') + '−' + dv('k') + ')!')}`,
          fmtNum(dcPerm(n, k), 9) + ' / ' + fmtNum(dcFact(k), 9) + ' = ' + fmtNum(dcChoose(n, k), 9)),
        drvSay('that division is legal only because every subset is over-counted EQUALLY',
          'Each k-element subset appears exactly k! times among the arrangements, the same number for every subset, so dividing is exact. When the over-counting is uneven — which happens the moment repeats are allowed — this argument fails, and it is the commonest place a counting proof goes wrong.'),
        drvStep('order does not matter, repeats allowed — stars and bars',
          `${dv('C')}(${dv('n')}${dop('+')}${dv('k')}${dop('−')}1, ${dv('k')})`,
          fmtNum(dcChoose(n + k - 1, k), 9)),
        drvSay('and stars and bars is a bijection, not a formula',
          'A multiset of k things from n types is a row of k stars split by n−1 bars: the stars before the first bar are type A, and so on. Every arrangement of k stars and n−1 bars gives exactly one multiset and every multiset gives exactly one arrangement, so the two sets have the same size — and counting the arrangements is the second row of this table. Setting up a bijection with something already counted is the standard move of the whole subject.'),
        drvStep('and the panel does not take any of it on trust',
          `enumerate, and count`,
          C.overflow ? 'more than ' + DC_DRAW_CAP + ' objects — the enumeration refuses rather than showing part of a list'
                     : C.enumerated + ' objects built one at a time, against a closed form of ' +
                       fmtNum(C.closed, 9) + ' — ' + (C.agree ? 'identical' : 'THEY DISAGREE')),
        drvSay('which is a luxury almost no other subject has',
          'A closed form for an integral can only be checked against a quadrature, which has its own error. A closed form for a count can be checked against the count. If the two disagree the formula is wrong, full stop — there is no tolerance to argue about and no convergence to wait for.')
      ],
      note:'The cap is ' + DC_DRAW_CAP + ' objects, and above it the enumeration refuses. ' +
           'Truncating the list would turn a wrong count into a plausible one.'
    };
  },
  readout(st){
    const N = this.cur(st), C = N.C, n = N.n, k = N.k;
    const others = Object.keys(DC_KINDS).map(kk =>
      kv(DC_KINDS[kk].sym, fmtNum(DC_KINDS[kk].f(n, k), 9) +
         (kk === st.kind ? '  <span style="color:var(--c-pos)">← showing</span>' : ''))).join('');
    return `<div class="card tight"><div class="ttl">${DC_KINDS[st.kind].name}</div>
      ${kv('n and k', n + ' and ' + k)}
      ${kv('closed form', DC_KINDS[st.kind].ex + '  =  ' + fmtNum(C.closed, 12))}
      ${kv('objects actually built', C.overflow
          ? 'refused — more than ' + DC_DRAW_CAP + ' of them'
          : fmtNum(C.enumerated, 9))}
      ${kv('the two, compared', C.overflow
          ? 'not available at this n and k'
          : (C.agree ? '<span style="color:var(--c-pos)">identical — every object counted once</span>'
                     : '<span style="color:var(--c-neg)">they differ, and the formula is wrong</span>'))}
      ${kv('still an exact integer?', C.exact ? 'yes' : 'no — past 2⁵³, so float64 has lost the last digits')}
    </div>
    <div class="card tight"><div class="ttl">All four, at this n and k</div>
      ${others}
      <p class="help">The four are related by two divisions and nothing else. Going from
      <b>nᵏ</b> to <b>P(n, k)</b> forbids repeats; going from <b>P(n, k)</b> to <b>C(n, k)</b> divides
      by k! because every subset was counted once per ordering. The fourth is not obtained by dividing
      at all — the over-counting there is uneven, which is exactly why stars and bars is needed.</p>
    </div>
    <div class="card tight"><div class="ttl">Where the arithmetic runs out</div>
      ${kv('C(52, 26), the multiplicative way', fmtNum(dcChoose(52, 26), 18))}
      ${kv('the same, as 52!/(26!)²', fmtNum(dcFact(52) / (dcFact(26) * dcFact(26)), 18))}
      ${kv('the difference', fmtGap(Math.abs(dcChoose(52, 26) - dcFact(52) / (dcFact(26) * dcFact(26))),
           dcChoose(52, 26)))}
      <p class="help">The answer is an integer — the number of thirteen-card bridge hands' bigger
      cousin — and the obvious route does not return one. 52! is 8×10⁶⁷, far past where float64 keeps
      integers, so the numerator is rounded before the division ever happens. The multiplicative form
      keeps every partial product an integer and stays exact.</p>
      <p class="help">This is the units wing's lesson in a discrete setting, and it is worth the
      comparison. There, subtracting two nearly equal numbers destroyed the digits; here, forming a
      huge intermediate and then dividing it away does. Both are the same instruction: <b>rearrange so
      the arithmetic never leaves the range where it is exact.</b></p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">${DC_KINDS[st.kind].sym}</div>
      <div style="color:var(--c-pos)">${fmtNum(N.C.closed, 9)}</div>
      <div style="color:var(--c-dim)">${N.C.overflow ? 'too many to draw' : N.C.enumerated + ' drawn'}</div>`;
  },
  legend(st){
    const N = this.cur(st);
    const L = [];
    for(let i = 0; i < Math.min(N.n, 6); i++){
      const c = rampSeq(N.n > 1 ? i / (N.n - 1) : 0);
      L.push(['rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')', 'element ' + String.fromCharCode(65 + i)]);
    }
    if(N.n > 6) L.push(['var(--c-dim)', '… and ' + (N.n - 6) + ' more']);
    return L;
  },
  dockLegend:true
};

/* ============================================================================
   2 · the birthday problem — which is a ratio of two of those four
   ============================================================================ */
const DC_BIRTH = {
  days:  { name:'days in a year', N:365, label:'people', why:'The classic. Twenty-three people give a better than even chance of a shared birthday, and almost nobody believes it before seeing it. The reason it feels wrong is that people picture the 22 comparisons involving <i>themselves</i> and not the 253 pairs that exist.' },
  coins: { name:'a 32-bit hash', N:4294967296, label:'items', why:'The same arithmetic, and the reason it matters outside parlour tricks. A 32-bit hash collides with probability a half after about 77 000 items — not after two billion. Every hash-table, every git object store and every content-addressed system is sized against this curve rather than against the table size.' },
  small: { name:'a twelve-sided die', N:12, label:'rolls', why:'Small enough that the enumeration in the stage next door could list every outcome. Four rolls already give a better than even chance of a repeat, which is the same surprise at a scale you can check by hand.' },
  month: { name:'months', N:12, label:'people', why:'Identical arithmetic to the die, and worth having both labels on it: the mathematics does not know whether the boxes are months or faces, and neither does the answer.' }
};

STAGES.dcBirth = {
  title:'The birthday problem',
  enter(st, o){
    st.bkey = o.bkey || 'days';
    st.k = o.k === undefined ? 23 : o.k;
    st.trials = o.trials || 20000;
  },
  cur(st){
    const B = DC_BIRTH[st.bkey];
    const k = Math.max(1, Math.round(st.k));
    const P = dcBirthday(k, B.N);
    /* the simulation is only honest on a domain small enough to sample; a
       32-bit space needs 77 000 draws per trial and the stage says so instead
       of running for a minute and returning a number */
    const canSim = B.N <= 100000 && k <= 2000;
    /* the seed is fixed, so this number cannot change between frames with the
       same inputs — and uncached it was 20 000 trials per cur() call, which
       frame(), the readout and the chip each make. Measured 2026-08-19: the
       stage spent 153 ms per frame, the worst on the site by a factor of 8. */
    const sKey = canSim ? st.bkey + '|' + k + '|' + st.trials : null;
    let S = null;
    if(canSim){
      if(!st._sCache || st._sCache.key !== sKey)
        st._sCache = { key:sKey, S:dcBirthdaySim(k, B.N, st.trials, 20250819) };
      S = st._sCache.S;
    }
    /* the half-way point, found by bisection on the exact product */
    let lo = 1, hi = Math.min(B.N + 1, 200000);
    while(hi - lo > 1){
      const mid = Math.floor((lo + hi) / 2);
      if(dcBirthday(mid, B.N).pSome < 0.5) lo = mid; else hi = mid;
    }
    return { B, k, P, S, half:hi, canSim,
             sqrtN:dcBirthHalf(B.N), scaleN:dcBirthScale(B.N),
             pairs:dcChoose(k, 2) };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('dcBiK', st.bkey, Object.keys(DC_BIRTH).map(k => [k, DC_BIRTH[k].name])) +
      ctlRow('how many ' + N.B.label, ctlSlider('dcBiN', 1, N.B.N <= 400 ? Math.min(120, N.B.N + 5) : 400, 1, st.k)) +
      (N.canSim ? ctlRow('trials in the simulation', ctlSlider('dcBiT', 2000, 200000, 2000, st.trials)) : '') +
      `<p class="help">The probability of <b>no</b> clash is the second counting formula divided by
      the first: P(N, k)/Nᵏ — the sequences with all entries different, over all sequences. That is
      the whole calculation, and everything surprising about it is in how fast a falling product of
      terms slightly below 1 collapses.</p>
      <p class="help">${N.canSim ? 'The dashed curve is a simulation drawing actual ' + N.B.label +
        ' and looking for a repeat; it never evaluates the product.' :
        'This domain is too large to sample honestly — a trial would need thousands of draws — so the panel shows the exact curve alone and says so rather than running a simulation nobody would wait for.'}</p>`;
  },
  wire(){
    ctWireSeg('dcBiK', v => { ST.bkey = v; ST.k = Math.min(ST.k, DC_BIRTH[v].N + 5); });
    wireSlider('dcBiN', () => ST.k, v => { ST.k = Math.round(v); }, v => Math.round(v) + '');
    wireSlider('dcBiT', () => ST.trials, v => { ST.trials = Math.round(v); },
               v => fmtNum(Math.round(v), 7) + ' trials');
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(44, z.h + 10);
    const B = ctFitBox(56, top, W - 100, H - top - 58);
    const kmax = N.B.N <= 400 ? Math.min(120, N.B.N + 5) : 400;
    const P = mkPlot(B.px, B.py, B.pw, B.ph, 0, kmax, 0, 1.02);
    plotFrame(ctx, P, 'how many ' + N.B.label, 'probability of at least one clash',
              'the exact curve, and a simulation that never evaluates it');
    ctGrid(ctx, P);
    /* the half line first, underneath */
    ctPath(ctx, P, [{ x:0, y:0.5 }, { x:kmax, y:0.5 }], rgbCss(TH.faint), 1.2, [5, 4]);
    plotCurve(ctx, P, k => dcBirthday(Math.max(0, k), N.B.N).pSome, 160, rgbCss(TH.pos), 2.4);
    if(N.canSim){
      /* every point of this sweep is seeded, so the whole dashed curve is a
         pure function of (domain, trials, kmax) — recompute it only when one
         of those moves, never per frame (the 2026-08-19 frame-cost sweep
         found this loop redrawing ~26 × 4000 seeded trials every frame) */
      const cKey = st.bkey + '|' + st.trials + '|' + kmax;
      if(!st._curveCache || st._curveCache.key !== cKey){
        const pts = [];
        const step = Math.max(1, Math.round(kmax / 26));
        for(let k = 1; k <= kmax; k += step){
          pts.push({ x:k, y:dcBirthdaySim(k, N.B.N, Math.min(4000, st.trials), 20250819 + k).p });
        }
        st._curveCache = { key:cKey, pts };
      }
      const pts = st._curveCache.pts;
      ctPath(ctx, P, pts, rgbCss(TH.warn), 1.8, [6, 4]);
      pts.forEach(p => ctDot(ctx, P, p.x, p.y, 3, rgbCss(TH.warn), rgbCss(TH.bg)));
    }
    if(N.half <= kmax){
      ctPath(ctx, P, [{ x:N.half, y:0 }, { x:N.half, y:1.02 }], rgbCss(TH.grad), 1.6, [4, 4]);
      ctText(ctx, P.X(N.half) + 6, P.Y(0.18), 'even money at ' + N.half,
             rgbCss(TH.grad), '600 11px ' + FONT_UI, 'left', 'middle');
    }
    ctDot(ctx, P, Math.min(N.k, kmax), N.P.pSome, 5, rgbCss(TH.curl), rgbCss(TH.bg));
    stageNote(ctx, N.k + ' ' + N.B.label + '  →  ' + fmtNum(100 * N.P.pSome, 5) + '% chance of a clash' +
              (N.S ? '   ·   simulated ' + fmtNum(100 * N.S.p, 4) + '%' : ''), W, H);
  },
  derive(st){
    const N = this.cur(st);
    return {
      title:'Why twenty-three is enough',
      steps:[
        drvSay('count the complement, because "at least one" is the hard direction',
          'Asking for the probability of at least one shared birthday means summing over one pair sharing, two pairs sharing, a triple sharing — a mess. Asking for the probability of NO shared birthday is one product. Complementary counting is the first move in almost every problem of this shape, and recognising when to make it is most of the skill.'),
        drvStep('sequences with all entries different, over all sequences',
          `${dv('P')}(${dv('N')}, ${dv('k')}) / ${dv('N')}${uniSup('^k')}`,
          fmtNum(dcPerm(N.B.N, Math.min(N.k, 170)), 9) + ' over ' + fmtSig(Math.pow(N.B.N, N.k), 6) +
          '  =  ' + fmtNum(N.P.pNone, 8)),
        drvSay('and both of those are rows of the table next door',
          'The numerator is "order matters, no repeats" and the denominator is "order matters, repeats allowed". The birthday problem is not a new piece of mathematics; it is one of the four counting formulas divided by another.'),
        drvStep('written as a falling product',
          `∏ (1 ${dop('−')} ${dv('i')}/${dv('N')}), &nbsp; ${dv('i')} ${dop('=')} 0 … ${dv('k')}${dop('−')}1`,
          'each factor is close to 1, and there are k of them'),
        drvStep('so the exponent grows as the number of PAIRS, not of people',
          `${dfn('log')} ${dv('P')} ${dop('≈')} ${dop('−')}∑ ${dv('i')}/${dv('N')} ${dop('=')} ${dop('−')}${dfrac(dv('k') + '(' + dv('k') + '−1)', '2' + dv('N'))}`,
          'at k = ' + N.k + ' there are ' + fmtNum(N.pairs, 9) + ' pairs, not ' + (N.k - 1)),
        drvSay('and that is the entire resolution of the paradox',
          'The intuition that fails is picturing the k−1 comparisons involving <em>you</em>. The event is about all k(k−1)/2 pairs, which at 23 people is 253 — an order of magnitude more. Nothing about the arithmetic is subtle; the mistake is in which set is being counted.'),
        drvStep('setting that exponent to log 2 gives the half-way point',
          `${dv('k')}(${dv('k')}${dop('−')}1)/2${dv('N')} ${dop('=')} ${dfn('ln')}2 &nbsp; ⇒ &nbsp; ${dv('k')} ${dop('=')} ½ ${dop('+')} √(¼ ${dop('+')} 2 ${dfn('ln')}2 · ${dv('N')})`,
          'that gives ' + fmtNum(N.sqrtN, 6) + ', and bisecting the exact product gives ' +
          N.half + ' — ' + fmtNum(Math.abs(N.sqrtN - N.half), 4) + ' apart'),
        drvSay('and it is worth solving the quadratic rather than dropping the linear term',
          'The familiar form 1.177√N comes from dropping the k/2, and it is the right SCALING — but a term linear in k costs an absolute error of order 1, which on a quantity whose answer is an integer is the whole of the accuracy. At N = 365 it gives 22.49 against a crossing at 23, and at N = 12 it gives 4.08 against 5. Keeping the quarter costs one more character and lands inside one person at every setting here.'),
        drvSay('the √N is still the part worth carrying away',
          'It says the answer scales as the square root of the number of boxes, so multiplying the boxes by a hundred only multiplies the crowd by ten. That is why a 32-bit hash collides after tens of thousands of items rather than after billions, and why every content-addressed system in use is sized against this curve.'),
        N.S ? drvStep('and the curve is drawn twice, once without the formula',
          `draw ${dv('k')} at random, look for a repeat`,
          fmtNum(N.S.n, 7) + ' trials give ' + fmtNum(N.S.p, 6) + ' against ' + fmtNum(N.P.pSome, 6) +
          ' — ' + fmtNum(Math.abs(N.S.p - N.P.pSome) / Math.max(1e-12, N.S.se), 3) +
          ' standard errors apart')
           : drvSay('and here the second route is declined rather than faked',
          'A trial on this domain needs tens of thousands of draws before a clash is likely, so a simulation would take longer than anyone would wait and would still be noisier than the exact product. Saying so is better than running something slow and calling it a check.')
      ],
      note:'The product is exact arithmetic; the simulation is a measurement with its own error bar, ' +
           'and the panel prints that error bar rather than the agreement alone.'
    };
  },
  readout(st){
    const N = this.cur(st);
    return `<div class="card tight"><div class="ttl">${N.B.name} — ${fmtNum(N.B.N, 12)} boxes</div>
      ${kv('how many ' + N.B.label, String(N.k))}
      ${kv('pairs among them', fmtNum(N.pairs, 9) + '  <span style="color:var(--c-dim)">— this is the number the intuition misses</span>')}
      ${kv('P(no clash)', fmtNum(N.P.pNone, 8))}
      ${kv('P(at least one)', fmtNum(N.P.pSome, 8) + '   =  ' + fmtNum(100 * N.P.pSome, 5) + '%')}
      ${kv('even money at', N.half + ' ' + N.B.label)}
      ${kv('the closed-form estimate', fmtNum(N.sqrtN, 6) + '  —  ' +
           fmtNum(Math.abs(N.sqrtN - N.half), 4) + ' from the true crossing')}
      ${kv('the familiar 1.177√N', fmtNum(N.scaleN, 6) + '  —  ' +
           fmtNum(Math.abs(N.scaleN - N.half), 4) + ' out, which is what dropping the k/2 costs')}
      <p class="help">${N.B.why}</p>
    </div>
    ${N.S ? `<div class="card tight"><div class="ttl">The same number, by drawing</div>
      ${kv('simulated', fmtNum(N.S.p, 6) + '  ± ' + fmtNum(N.S.se, 6) + '  over ' + fmtNum(N.S.n, 7) + ' trials')}
      ${kv('exact', fmtNum(N.P.pSome, 8))}
      ${kv('the two, compared', fmtAgree(N.S.p, N.P.pSome))}
      ${kv('in units of the sampling error', fmtNum(Math.abs(N.S.p - N.P.pSome) / Math.max(1e-12, N.S.se), 4) +
          ' standard errors')}
      <p class="help">The simulation never evaluates the product: it draws ${N.B.label} and looks for
      a repeat. Comparing a measurement with a formula only means something once the measurement's own
      error is printed beside it — raise the trial count and watch the standard error fall as 1/√N
      while the agreement stays where it is.</p>
    </div>` : `<div class="card tight"><div class="ttl">Why there is no simulation here</div>
      <p class="help">A single trial on ${fmtNum(N.B.N, 12)} boxes needs tens of thousands of draws
      before a clash becomes likely, and thousands of trials on top of that. It would be slower than
      the exact product and noisier, so the panel declines rather than showing a check that is worse
      than the thing it checks.</p>
      <p class="help">The exact product is still exact: it is a product of ${N.k} factors each below
      1, computed in float64, and every factor is between 0.99999 and 1 — no cancellation anywhere,
      so nothing is lost.</p>
    </div>`}`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">${N.k} ${N.B.label}</div>
      <div style="color:var(--c-pos)">${fmtNum(100 * N.P.pSome, 4)}%</div>
      <div style="color:var(--c-dim)">half at ${N.half}</div>`;
  },
  legend(st){
    const L = [['var(--c-pos)', 'the exact product'],
               ['var(--c-grad)', 'where it crosses a half']];
    if(this.cur(st).canSim) L.push(['var(--c-warn)', 'a simulation, which never evaluates the product']);
    L.push(['var(--c-curl)', 'the setting on the slider']);
    return L;
  },
  dockLegend:true
};
