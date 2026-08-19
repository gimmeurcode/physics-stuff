/* ============================================================================
   4y-bis · COMPLEX NUMBERS — roots, the fundamental theorem, and phasors
   The three stages here answer "what is it FOR":

     cnRoots    n-th roots as a regular n-gon, each one checked by raising it back
     cnPoly     every polynomial factors, over C — the roots found and verified
     cnPhasor   a sum of sinusoids as a sum of arrows, checked against the wave

   Engine: 41a-cnum.js.
   ============================================================================ */

/* "back to the 3th" is what `n + 'th'` prints, and it shipped for exactly as
   long as it took to look at the screenshot. Teens are the special case that
   catches a naive rule: 11th, 12th and 13th, not 11st, 12nd, 13rd. */
function cnOrd(n){
  const k = Math.abs(Math.round(n)), t = k % 100;
  if(t >= 11 && t <= 13) return k + 'th';
  return k + (['th', 'st', 'nd', 'rd'][k % 10] || 'th');
}

/* ---- 4 · the n-th roots --------------------------------------------------- */
STAGES.cnRoots = {
  title:'The n-th roots of a number',
  enter(st, o){
    st.of = o.of || '1';
    st.n = o.n === undefined ? 5 : o.n;
    st.show = Object.assign({ ngon:true, checkArrow:true }, o.show || {});
  },
  target(st){
    const P = cnParse(st.of);
    return { z:P.ok ? P.z : cx(1, 0), ok:P.ok, why:P.why };
  },
  controls(){
    const st = ST, T = this.target(st);
    return `<div class="row"><label class="lb" style="width:86px">the number</label>
      <span class="fld grow"><input id="cnRoZ" value="${esc(st.of)}" spellcheck="false"
        autocomplete="off" data-audit="-8 + 6i"
        aria-label="a complex number to take the roots of"></span></div>
      <div class="err" id="cnRoZerr">${T.ok ? '' : esc(T.why)}</div>
      <p class="help">a complex number — <b>1</b>, <b>-1</b>, <b>i</b>, <b>16</b>, <b>3 - 4i</b></p>` +
      ctlRow('which root', ctlSlider('cnRoN', 2, 12, 1, st.n)) +
      `<div class="row wrap">${ctChk('cnRoG', 'join them into a polygon', st.show.ngon)}
        ${ctChk('cnRoC', 'show one raised back to the n-th power', st.show.checkArrow)}</div>
      <p class="help">Over the real numbers "the" n-th root is a single number and negative inputs
      have none at all when n is even. Over ℂ every non-zero number has <b>exactly n</b> of them, they
      all have the same modulus, and they sit at equal angles — a regular n-gon, always.</p>
      <p class="help">The reason is one line: taking a root divides the argument by n, and the
      argument was only ever defined up to 2π, so the n choices of "which multiple of 2π" give n
      answers. Nothing is lost and nothing is arbitrary.</p>`;
  },
  wire(){
    const e = $('cnRoZ');
    if(e){
      const commit = () => {
        const P = cnParse(e.value);
        const err = $('cnRoZerr');
        if(P.ok){
          ST.of = e.value;
          if(err) err.textContent = '';
          e.parentElement.classList.remove('bad');
          buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
        } else {
          if(err) err.textContent = P.why;
          e.parentElement.classList.add('bad');
        }
      };
      e.addEventListener('change', commit);
      e.addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); commit(); } });
    }
    wireSlider('cnRoN', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(+v)));
    ctWireChk('cnRoG', v => { ST.show.ngon = v; });
    ctWireChk('cnRoC', v => { ST.show.checkArrow = v; });
  },
  frame(st, dt, ctx, W, H){
    const T = this.target(st), roots = cxRoots(T.z, st.n);
    const R = Math.pow(cxAbs(T.z), 1 / st.n);
    const half = Math.max(1.35 * Math.max(R, cxAbs(T.z) > 3 * R ? R : cxAbs(T.z)), 0.5);
    const P = cnPane(ctx, 40, 46, W - 80, H - 142, half, st.n + ' roots of ' + cnFmt(T.z, 4));
    ctParam(ctx, P, t => ({ x:R * Math.cos(t), y:R * Math.sin(t) }), 0, 2 * Math.PI, 240,
            rgbCss(TH.faint), 1.6, [4, 4]);
    if(st.show.ngon && roots.length > 1){
      const poly = roots.map(z => ({ x:z.re, y:z.im }));
      poly.push({ x:roots[0].re, y:roots[0].im });
      ctPath(ctx, P, poly, rgbCss(TH.curl, 0.55), 1.8);
    }
    roots.forEach((z, k) => {
      ctPath(ctx, P, [{ x:0, y:0 }, { x:z.re, y:z.im }], rgbCss(TH.pos, 0.55), 1.4);
      ctDot(ctx, P, z.re, z.im, 5, rgbCss(TH.pos), rgbCss(TH.bg));
      if(k === 0) ctText(ctx, P.X(z.re) + 9, P.Y(z.im) - 8, 'the principal one',
                         rgbCss(TH.pos), '600 11px ' + FONT_UI);
    });
    /* The window is sized to the ROOTS, and the number itself is usually much
       further out — |−8 + 6i| is 10 while its cube roots sit at 2.15. So the
       check arrow often cannot be drawn, and a ticked box that draws nothing is
       worse than one that explains itself: the panel still carries the number. */
    if(st.show.checkArrow && roots.length){
      if(cxAbs(T.z) <= half){
        const back = cnPowerTwo(roots[0], st.n).repeated;
        ctArrow(ctx, P, 0, 0, back.re, back.im, rgbCss(TH.warn), 2.2, 'that root, to the n');
        ctDot(ctx, P, T.z.re, T.z.im, 6, rgbCss(TH.warn), rgbCss(TH.bg));
      } else {
        ctText(ctx, 70, H - 52,
               'the number itself is at |z| = ' + fmtSig(cxAbs(T.z), 3) +
               ', off this window — the roots are at ' + fmtSig(R, 3) +
               ', so the check is in the panel rather than the picture',
               rgbCss(TH.warn), '11px ' + FONT_UI);
      }
    }
    ctText(ctx, 70, H - 34,
           'dashed: the circle of radius |z|^(1/' + st.n + ') — every root has the same modulus, by construction',
           rgbCss(TH.dim), '11px ' + FONT_UI);
    stageNote(ctx, 'n roots, n equal angles — the polygon is not a coincidence', W, H);
  },
  derive(st){
    const T = this.target(st), roots = cxRoots(T.z, st.n);
    const back = roots.length ? cnPowerTwo(roots[0], st.n) : null;
    const worst = roots.reduce((m, z) =>
      Math.max(m, cxAbs(cxSub(cnPowerTwo(z, st.n).repeated, T.z))), 0);
    return {
      title:'Why there are exactly n of them',
      steps:[
        drvStep('write the number as a modulus and an angle — and remember the ambiguity',
          `${dv('z')} ${dop('=')} ${dv('r')}(${dfn('cos')} θ ${dop('+')} i ${dfn('sin')} θ),  θ ${dfn('or')} θ ${dop('+')} 2π ${dfn('or')} θ ${dop('+')} 4π …`,
          `here r = ${fmtNum(cxAbs(T.z), 6)} and θ = ${ctDeg(cxArg(T.z))}, but θ + 2πk names the same point for every whole k`),
        drvStep('a root divides the modulus and the angle',
          `${dv('w')} ${dop('=')} ${dv('r')}^(1/${dv('n')}) ∠ (θ ${dop('+')} 2π${dv('k')})/${dv('n')}`,
          `modulus ${fmtNum(Math.pow(cxAbs(T.z), 1 / st.n), 6)} for all of them, angles ${st.n === 1 ? '' : 'spaced ' + fmtNum(360 / st.n, 4) + '° apart'}`),
        drvSay('and that is where the n comes from',
          'k = 0, 1, … n−1 give different angles; k = n gives θ/n + 2π, which is the same point as k = 0. So the list closes after exactly n entries — not "at most n", and not "n if you are lucky". The ambiguity in the argument, which looks like an annoyance everywhere else, is the whole content of the theorem here.'),
        drvStep('every one of them, raised back, must return the number',
          `${dv('w')}^${dv('n')} ${dop('=')} ${dv('z')} ${dfn('for all')} ${st.n} ${dfn('of them')}`,
          `worst discrepancy over all ${st.n}: ${fmtGap(worst, Math.max(1e-300, cxAbs(T.z)))}`),
        drvSay('which is the check, and it is not circular',
          'The roots are built from a division of the argument; raising one back multiplies complex numbers componentwise, with no argument taken anywhere. Two different pieces of arithmetic, one answer.'),
        drvSay('zero is the single exception, and it is not a special case bolted on',
          'Every step above divided the argument, and zero has no argument to divide — every direction leads to it equally. So the count fails there alone: 0 has exactly one n-th root, namely 0, which the factorisation zⁿ = 0 shows occurring n times over. That is the same distinction as "multiplicity" in the polynomial stage, met here in its simplest instance, and it is why the theorem is always stated for z ≠ 0.'),
        drvSay('the n-th roots of ONE are more than an example — they are a group',
          'Take z = 1. The n roots are then 1, ω, ω², … ωⁿ⁻¹ where ω = e^(2πi/n), and multiplying any two of them gives another one, because the exponents add modulo n. That closed system is the cyclic group of order n, and it is the reason the same picture keeps returning in unrelated subjects: the three phases of a mains supply, the n-fold symmetry of a crystal, the discrete Fourier transform’s twiddle factors, and the n points a fast Fourier transform recursively splits are all this same set of numbers.'),
        back ? drvStep('the principal root, taken back up, both ways',
          `${dfn('by multiplying')}: ${cnFmt(back.repeated, 8)}    ${dfn('by de Moivre')}: ${cnFmt(back.moivre, 8)}`,
          fmtGap(back.gap, Math.max(1e-300, back.gross)))
              : drvSay('nothing to raise', 'There are no roots of the number you typed.')
      ],
      note:'Zero is the one exception, and for a reason: it has one n-th root, itself, n times over.'
    };
  },
  readout(st){
    const T = this.target(st), roots = cxRoots(T.z, st.n);
    const rows = roots.map((z, k) => {
      const back = cnPowerTwo(z, st.n).repeated;
      return kv('root ' + (k + 1), cnFmt(z, 6) + '   —  back to the ' + cnOrd(st.n) + ': ' +
        fmtGapTight(cxAbs(cxSub(back, T.z)), Math.max(1e-300, cxAbs(T.z))));
    }).join('');
    const sum = roots.reduce((s, z) => cxAdd(s, z), cx(0, 0));
    return `<div class="card tight"><div class="ttl">All ${st.n} of them</div>
      ${rows}
      <p class="help">Each row raises that root back to the n-th power by ${st.n} ordinary complex
      multiplications and compares with the number you typed. Nothing here trusts the formula that
      produced the roots.</p>
    </div>
    <div class="card tight"><div class="ttl">Two things that fall out</div>
      ${kv('common modulus', fmtNum(Math.pow(cxAbs(T.z), 1 / st.n), 8))}
      ${kv('angle between neighbours', st.n > 1 ? fmtNum(360 / st.n, 6) + '°' : 'only one root')}
      ${kv('they sum to', cnFmt(sum, 8))}
      ${kv('and that sum against zero', st.n > 1
        ? fmtGap(cxAbs(sum), roots.reduce((s, z) => s + cxAbs(z), 0))
        : 'one root — nothing to cancel')}
      <p class="help">For n &gt; 1 the roots always sum to zero, because they are the vertices of a
      regular polygon centred on the origin — and equally, because the z^(n−1) coefficient of
      zⁿ − a is zero and Vieta says the roots sum to it. Geometry and algebra, same statement.</p>
    </div>`;
  },
  chip(st){
    const T = this.target(st);
    return `<div class="k">${st.n} roots</div>
      <div style="color:var(--c-pos)">|w| = ${fmtNum(Math.pow(cxAbs(T.z), 1 / st.n), 4)}</div>
      <div style="color:var(--c-dim)">${st.n > 1 ? fmtNum(360 / st.n, 3) + '° apart' : 'one only'}</div>`;
  },
  legend(st){
    const L = [['var(--c-pos)', 'the n roots'], ['var(--c-faint)', 'their common circle']];
    if(st.show.ngon) L.push(['var(--c-curl)', 'the regular polygon they form']);
    if(st.show.checkArrow) L.push(['var(--c-warn)', 'one of them raised back to the n-th power']);
    return L;
  },
  dockLegend:true
};

/* ---- 5 · the fundamental theorem of algebra ------------------------------- */
const CN_POLY_SHEET = '1 0 0 -1';
STAGES.cnPoly = {
  title:'Every polynomial factors',
  enter(st, o){
    st.pkey = o.pkey || 'unity3';
    st.sheet = o.sheet === undefined ? CN_POLY_SHEET : o.sheet;
    st.show = Object.assign({ circle:true, resid:true }, o.show || {});
  },
  coeffs(st){
    const txt = st.pkey === 'custom'
      ? (st.sheet === undefined ? CN_POLY_SHEET : st.sheet)
      : (CN_POLYS[st.pkey] || CN_POLYS.unity3).coeffs;
    return cnCoeffsParse(txt);
  },
  controls(){
    const st = ST, G = this.coeffs(st);
    const txt = st.pkey === 'custom'
      ? (st.sheet === undefined ? CN_POLY_SHEET : st.sheet)
      : (CN_POLYS[st.pkey] || CN_POLYS.unity3).coeffs;
    return ctlRow('the polynomial', ctSeg('cnPyK', st.pkey,
        Object.keys(CN_POLYS).map(k => [k, CN_POLYS[k].short]).concat([['custom', 'type your own']]))) +
      `<div class="fld" style="align-items:stretch">
        <textarea id="cnPyS" rows="2" spellcheck="false" autocomplete="off"
          aria-label="coefficients, highest power first, separated by spaces"
          data-audit="1 0 0 0 -1"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(txt)}</textarea>
      </div>
      <div class="row wrap">${ctBtn('cnPyGo', 'Find the roots')}</div>
      <p class="help" style="color:${G.ok ? 'var(--faint)' : 'var(--c-neg)'}">${G.ok
        ? 'coefficients, <b>highest power first</b>: <b>1 0 0 -1</b> is z³ − 1. Each one may itself be complex — <b>1 -3-1i 2+2i</b>.'
        : esc(G.why)}</p>
      <div class="row wrap">${ctChk('cnPyC', 'the circle that contains every root', st.show.circle)}
        ${ctChk('cnPyR', 'how well each root satisfies the equation', st.show.resid)}</div>
      <p class="help">The fundamental theorem of algebra says a degree-n polynomial has exactly n
      roots in ℂ, counted with multiplicity — and that is the reason to have built ℂ at all. Over ℝ
      the count depends on the polynomial; over ℂ it never does.</p>`;
  },
  wire(){
    ctWireSeg('cnPyK', k => {
      ST.pkey = k;
      if(CN_POLYS[k]) ST.sheet = CN_POLYS[k].coeffs;
    });
    const apply = () => {
      const box = $('cnPyS'); if(!box) return;
      ST.sheet = box.value; ST.pkey = 'custom';
      buildStagePanel(); refreshStageReadout(); updateStageChip(); updateStageLegend();
    };
    const b = $('cnPyS'); if(b) b.addEventListener('change', apply);
    ctWireBtn('cnPyGo', apply);
    ctWireChk('cnPyC', v => { ST.show.circle = v; });
    ctWireChk('cnPyR', v => { ST.show.resid = v; });
  },
  frame(st, dt, ctx, W, H){
    const G = this.coeffs(st);
    if(!G.ok){
      const P = cnPane(ctx, 40, 46, W - 80, H - 108, 2, 'nothing to factor');
      ctText(ctx, 70, 90, G.why, rgbCss(TH.neg), '600 13px ' + FONT_UI);
      return;
    }
    const M = cnPolyMeasure(G.c);
    if(!M.ok){
      cnPane(ctx, 40, 46, W - 80, H - 108, 2, 'nothing to factor');
      ctText(ctx, 70, 90, M.why, rgbCss(TH.neg), '600 13px ' + FONT_UI);
      return;
    }
    const half = Math.max(1.25 * M.roots.reduce((m, z) => Math.max(m, cxAbs(z)), 0.5),
                          st.show.circle ? 1.1 * M.bound : 0);
    const P = cnPane(ctx, 40, 46, W - 80, H - 142, half,
                     'degree ' + M.degree + ' — so exactly ' + M.degree + ' roots');
    if(st.show.circle)
      ctParam(ctx, P, t => ({ x:M.bound * Math.cos(t), y:M.bound * Math.sin(t) }), 0, 2 * Math.PI,
              240, rgbCss(TH.faint), 1.6, [5, 5]);
    ctParam(ctx, P, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 200,
            rgbCss(TH.faint, 0.55), 1.2, [2, 4]);
    /* A repeated root is several roots at one PLACE, so its label would be drawn
       over itself once per copy — which renders as a smeared bold string and
       says nothing about the multiplicity. Label each place once, and say how
       many roots are there. */
    const drawn = [];
    M.roots.forEach((z, k) => {
      const isReal = Math.abs(z.im) <= Math.max(1e-8, 4 * M.expected);
      ctDot(ctx, P, z.re, z.im, 6, isReal ? rgbCss(TH.warn) : rgbCss(TH.pos), rgbCss(TH.bg));
      const px = P.X(z.re), py = P.Y(z.im);
      if(drawn.some(d => Math.hypot(d.x - px, d.y - py) < 14)) return;
      drawn.push({ x:px, y:py });
      const here = M.groups.find(g => cxAbs(cxSub(g.at, z)) < 1e-5 * Math.max(1, M.bound));
      ctText(ctx, px + 9, py - 7, cnFmt(z, 4) + (here && here.m > 1 ? '  (×' + here.m + ')' : ''),
             isReal ? rgbCss(TH.warn) : rgbCss(TH.pos), '11px ' + FONT_MONO);
      if(st.show.resid)
        ctText(ctx, px + 9, py + 9, '|p| ' + fmtGapTight(M.resid[k].res, M.resid[k].gross),
               rgbCss(TH.dim), '10px ' + FONT_MONO);
    });
    if(M.mult > 1)
      ctText(ctx, 70, H - 52,
             'a repeated root: two of these points are the same root twice, and neither can be located better than about ' +
             fmtSig(M.expected, 2), rgbCss(TH.curl), '11px ' + FONT_UI);
    ctText(ctx, 70, H - 34,
           st.show.circle ? 'dashed outer circle: Cauchy’s bound — no root of this polynomial can lie outside it'
                          : 'faint circle: the unit circle',
           rgbCss(TH.dim), '11px ' + FONT_UI);
    stageNote(ctx, M.degree + ' roots for a degree-' + M.degree + ' polynomial, always', W, H);
  },
  derive(st){
    const G = this.coeffs(st);
    if(!G.ok) return { title:'Nothing to factor', steps:[drvSay('the coefficients did not read', G.why)], note:'' };
    const M = cnPolyMeasure(G.c);
    if(!M.ok) return { title:'Nothing to factor', steps:[drvSay('no roots to find', M.why)], note:'' };
    return {
      title:'The theorem, and how this panel checks it rather than assuming it',
      steps:[
        drvStep('the claim',
          `${dfn('every')} ${dv('p')} ${dfn('of degree')} ${dv('n')} ${dop('=')} ${dv('c')}₀${dv('z')}ⁿ ${dop('+')} … ${dfn('has')} ${dv('n')} ${dfn('roots in')} ℂ`,
          `this one has degree ${M.degree}, and ${M.roots.length} root${M.roots.length === 1 ? '' : 's'} were found`),
        drvStep('each root is checked by putting it back in',
          `|${dv('p')}(${dv('r')}${dop('_')}${dv('k')})| ${dfn('against')} ${'∑'}|${dv('c')}${dop('_')}${dv('j')}||${dv('r')}${dop('_')}${dv('k')}|^${dv('j')}`,
          `worst: ${fmtGap(M.worst, M.worstGross)}`),
        drvSay('the scale on that row is not decoration',
          'A residual of 10⁻⁹ is excellent on a polynomial whose terms are of order 1 and meaningless on one whose terms are of order 10¹². The comparison is against the same polynomial evaluated with every sign made positive — what the cancellation had to cancel.'),
        drvStep('then the factors are multiplied back out — a route that never evaluates p',
          `${dv('c')}₀(${dv('z')} ${dop('−')} ${dv('r')}₁)(${dv('z')} ${dop('−')} ${dv('r')}₂)… ${dfn('against the coefficients you typed')}`,
          fmtGap(M.vieta.gap, M.vieta.gross)),
        drvStep('two coefficients you can check by eye',
          `${'∑'}${dv('r')}${dop('_')}${dv('k')} ${dop('=')} ${dop('−')}${dv('c')}₁/${dv('c')}₀,   ${'∏'}${dv('r')}${dop('_')}${dv('k')} ${dop('=')} (${dop('−')}1)ⁿ${dv('c')}${dop('_')}${dv('n')}/${dv('c')}₀`,
          `sum ${cnFmt(M.vieta.sum, 6)} against ${cnFmt(M.vieta.sumSaid, 6)};  product ${cnFmt(M.vieta.prod, 6)} against ${cnFmt(M.vieta.prodSaid, 6)}`),
        M.mult > 1
          ? drvSay('this polynomial has a repeated root, and that changes what "accurate" means',
              'Near a root of multiplicity m, p behaves like (z − r)^m, so a perturbation of size ε in the coefficients moves the root by ε^(1/m). At m = 2 that is √ε ≈ 1.5×10⁻⁸ — and it is a property of the problem, not of the method: exact arithmetic followed by a floating-point square root hits the same wall. The panel derives the accuracy it may claim from the multiplicity it measured rather than quoting a fixed figure.')
          : drvSay('all the roots here are simple, so they are as accurate as the arithmetic allows',
              'Every root is a simple one, which is the well-conditioned case: the residual and the Vieta reconstruction both sit at round-off. A repeated root would not, and the panel would say so.'),
        drvSay('and the real-coefficient case gives one more fact for free',
          'If every coefficient is real then p(z̄) = conj(p(z)), so a non-real root forces its conjugate to be a root too. That is why real polynomials of odd degree always have at least one real root — the non-real ones come in pairs and cannot use them all up.'),
        drvSay('the theorem is about algebra and every proof of it is analysis',
          'That is worth saying plainly, because the name suggests otherwise. No purely algebraic argument establishes it: the shortest proof applies Liouville’s theorem to 1/p, and the most elementary observes that |p| is continuous, tends to infinity, therefore attains a minimum — and that a non-zero minimum can always be beaten by stepping in the right direction. Both use completeness of the reals, which is an analytic property. The panel here does neither; it finds the roots numerically and then checks them by a route that never evaluates p, which is evidence rather than proof, and says so.'),
        drvSay('what the theorem buys is the disappearance of a case analysis',
          'Over ℝ, "how many roots does this have?" is a question about the particular polynomial, answered by discriminants, sign changes and sketching. Over ℂ the answer is always n, so factorisation becomes a structural fact rather than a lucky one — partial fractions always work, a linear recurrence always has a closed form, a matrix always has an eigenvalue, and a differential equation with constant coefficients always has a full set of exponential solutions. Every one of those is this theorem being spent.')
      ],
      note:'“Exactly n roots” is what makes ℂ the right place to do algebra. Over ℝ the count is a case analysis.'
    };
  },
  readout(st){
    const G = this.coeffs(st);
    if(!G.ok) return `<div class="card tight"><div class="ttl">The coefficients</div>
      <p class="help" style="color:var(--c-neg)">${esc(G.why)}</p></div>`;
    const M = cnPolyMeasure(G.c);
    if(!M.ok) return `<div class="card tight"><div class="ttl">No roots</div>
      <p class="help" style="color:var(--c-neg)">${esc(M.why)}</p></div>`;
    const CP = cnConjugatePairs(G.c, M.roots);
    /* the residual gets ONE row with its scale rather than a sentence per root:
       fmtGap prints prose, which is right for a verdict and wraps to two lines
       when it is glued onto the end of every entry in a list */
    const rows = M.roots.map((z, k) => kv('root ' + (k + 1), cnFmt(z, 8))).join('');
    return `<div class="card tight"><div class="ttl">${M.degree} roots for degree ${M.degree}</div>
      ${rows}
      ${kv('worst |p(root)|, against the terms that cancelled', fmtGap(M.worst, M.worstGross))}
      ${kv('how many are real', M.real + ' of ' + M.degree)}
      ${kv('largest multiplicity', M.mult + (M.mult > 1 ? ' — a repeated root' : ' — all simple'))}
      ${kv('so the best accuracy available', fmtSig(M.expected, 3) + (M.mult > 1 ? '  (= ε^(1/' + M.mult + '))' : '  (= ε)'))}
    </div>
    <div class="card tight"><div class="ttl">Checked by a route that never found a root</div>
      ${kv('the factors multiplied back out', fmtGap(M.vieta.gap, M.vieta.gross))}
      ${kv('Σ roots against −c₁/c₀', fmtGap(M.vieta.sumGap, Math.max(1, cxAbs(M.vieta.sumSaid))))}
      ${kv('Π roots against (−1)ⁿcₙ/c₀', fmtGap(M.vieta.prodGap, Math.max(1, cxAbs(M.vieta.prodSaid))))}
      ${kv('non-real roots in conjugate pairs', CP.applies
        ? fmtGap(CP.worst, Math.max(1e-12, CP.scale))
        : 'not claimed — ' + CP.why)}
      <p class="help">${st.pkey === 'custom' ? 'Your own coefficients.' : CN_POLYS[st.pkey].why}</p>
    </div>`;
  },
  chip(st){
    const G = this.coeffs(st);
    if(!G.ok) return `<div class="k">coefficients</div><div style="color:var(--c-neg)">unreadable</div>`;
    const M = cnPolyMeasure(G.c);
    if(!M.ok) return `<div class="k">no roots</div><div style="color:var(--c-neg)">${esc(M.why)}</div>`;
    return `<div class="k">degree ${M.degree}</div>
      <div style="color:var(--c-pos)">${M.roots.length} roots</div>
      <div style="color:var(--c-dim)">${M.real} real</div>`;
  },
  legend(st){
    const L = [['var(--c-pos)', 'a root with an imaginary part'],
               ['var(--c-warn)', 'a root that is real']];
    if(st.show.circle) L.push(['var(--c-faint)', 'Cauchy’s bound — every root is inside it']);
    return L;
  },
  dockLegend:true
};

/* ---- 6 · phasors ---------------------------------------------------------- */
STAGES.cnPhasor = {
  title:'Adding waves by adding arrows',
  enter(st, o){
    st.fkey = o.fkey || 'quarter';
    st.t = o.t === undefined ? 0 : o.t;
    st.run = o.run === undefined ? true : !!o.run;
  },
  parts(st){
    if(st.fkey === 'custom'){
      const own = pkOwn(st, 'cnPh', [], [
        { k:'a1', label:'A₁', def:1 }, { k:'p1', label:'φ₁ (deg)', def:0 },
        { k:'a2', label:'A₂', def:1 }, { k:'p2', label:'φ₂ (deg)', def:90 },
        { k:'a3', label:'A₃', def:0 }, { k:'p3', label:'φ₃ (deg)', def:210 }
      ]);
      const list = [];
      for(const n of [1, 2, 3]){
        const a = +own['a' + n];
        if(Math.abs(a) > 1e-12) list.push({ amp:a, phase:(+own['p' + n]) * Math.PI / 180 });
      }
      return { list:list.length ? list : [{ amp:1, phase:0 }], name:'your own waves' };
    }
    const P = CN_PHASORS[st.fkey] || CN_PHASORS.quarter;
    return { list:P.parts, name:P.name };
  },
  controls(){
    const st = ST;
    return ctlRow('the waves', ctSeg('cnPhK', st.fkey,
        Object.keys(CN_PHASORS).map(k => [k, CN_PHASORS[k].short]).concat([['custom', 'type your own']]))) +
      pkBoxes('cnPh', st.fkey, st, [], [
        { k:'a1', label:'A₁', def:1 }, { k:'p1', label:'φ₁ (deg)', def:0 },
        { k:'a2', label:'A₂', def:1 }, { k:'p2', label:'φ₂ (deg)', def:90 },
        { k:'a3', label:'A₃', def:0 }, { k:'p3', label:'φ₃ (deg)', def:210 }
      ], 'Three amplitudes and three phases in degrees. An amplitude of 0 drops that wave. ' +
         'Expressions are allowed, so <b>sqrt(2)</b> and <b>180/7</b> both work.') +
      ctChk('cnPhR', 'let it turn', st.run) +
      `<p class="help">Every wave here is A cos(ωt + φ) at the <b>same</b> ω. Adding them by
      trigonometry is a page of identities; adding them as arrows is a triangle. That substitution is
      the reason alternating-current analysis, interference and Fourier coefficients all look the
      same on paper.</p>
      <p class="help">The panel does not take the arrow sum on trust: it samples the summed
      <i>wave</i> over one full period and extracts an amplitude and a phase from it by projecting
      onto cos and sin. Two routes, one answer.</p>`;
  },
  wire(){
    ctWireSeg('cnPhK', v => { ST.fkey = v; });
    pkWireBoxes('cnPh', ST.fkey, ST, [], [
      { k:'a1', label:'A₁', def:1 }, { k:'p1', label:'φ₁ (deg)', def:0 },
      { k:'a2', label:'A₂', def:1 }, { k:'p2', label:'φ₂ (deg)', def:90 },
      { k:'a3', label:'A₃', def:0 }, { k:'p3', label:'φ₃ (deg)', def:210 }
    ]);
    ctWireChk('cnPhR', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    if(st.run) st.t += dt * 1.1;
    const Pz = this.parts(st), S = cnPhasorSum(Pz.list);
    const gross = Pz.list.reduce((s, p) => s + Math.abs(p.amp), 0.4);
    /* Fit to the CHAIN, not to the sum of the amplitudes: three unit arrows at
       120° never leave a circle of radius 1, and a window sized to their total
       of 3 drew them a third the size they could have been. The chain's extent
       does not depend on t — turning every arrow by the same angle rotates the
       whole polygon — so the window does not breathe while it runs. */
    let reach = 0, walk = cx(0, 0);
    for(const p of Pz.list){
      walk = cxAdd(walk, { re:p.amp * Math.cos(p.phase), im:p.amp * Math.sin(p.phase) });
      reach = Math.max(reach, cxAbs(walk));
    }
    const half = 1.25 * Math.max(reach, 0.4);
    const paneW = Math.max(220, (W - 110) * 0.45);
    const P = cnPane(ctx, 34, 46, paneW, H - 108, half, 'the arrows, nose to tail');
    /* the chain, each arrow starting where the last one ended */
    let acc = cx(0, 0);
    const cols = [TH.pos, TH.neg, TH.curl, TH.grad];
    Pz.list.forEach((p, k) => {
      const step = { re:p.amp * Math.cos(p.phase + st.t), im:p.amp * Math.sin(p.phase + st.t) };
      const nxt = cxAdd(acc, step);
      ctArrow(ctx, P, acc.re, acc.im, nxt.re, nxt.im, rgbCss(cols[k % 4]), 2.2);
      acc = nxt;
    });
    ctArrow(ctx, P, 0, 0, acc.re, acc.im, rgbCss(TH.warn), 3, 'the sum');
    ctParam(ctx, P, t => ({ x:S.amp * Math.cos(t), y:S.amp * Math.sin(t) }), 0, 2 * Math.PI, 200,
            rgbCss(TH.warn, 0.3), 1.4, [4, 4]);
    /* the waves themselves, so the arrow picture is anchored to something real */
    const Q = mkPlot(paneW + 84, 60, W - paneW - 130, H - 130, 0, 4 * Math.PI, -gross * 1.15, gross * 1.15);
    plotFrame(ctx, Q, 'ωt', null, 'the same waves, and their sum');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [0, Math.PI, 2 * Math.PI, 3 * Math.PI, 4 * Math.PI],
               v => (Math.abs(v) < 1e-9 ? '0' : fmtNum(v / Math.PI, 2) + 'π'));
    Pz.list.forEach((p, k) => {
      plotCurve(ctx, Q, t => p.amp * Math.cos(t + p.phase), 400, rgbCss(cols[k % 4], 0.75), 1.6);
    });
    plotCurve(ctx, Q, t => Pz.list.reduce((s, p) => s + p.amp * Math.cos(t + p.phase), 0),
              500, rgbCss(TH.warn), 2.6);
    const tt = ((st.t % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
    ctPath(ctx, Q, [{ x:tt, y:-gross * 1.15 }, { x:tt, y:gross * 1.15 }], rgbCss(TH.faint), 1.2, [4, 4]);
    stageNote(ctx, 'the sum of the arrows is the amplitude and phase of the summed wave', W, H);
  },
  derive(st){
    const Pz = this.parts(st), S = cnPhasorSum(Pz.list);
    return {
      title:'Why a sum of sinusoids is one sinusoid',
      steps:[
        drvStep('write each wave as the real part of a rotating complex number',
          `${dv('A')}${dfn('cos')}(ω${dv('t')} ${dop('+')} φ) ${dop('=')} ${dfn('Re')}[${dv('A')}${dfn('e')}^(iφ) ${dop('·')} ${dfn('e')}^(iω${dv('t')})]`,
          'the constant part Ae^(iφ) is the phasor; the e^(iωt) is common to every term'),
        drvStep('add them — and the common factor comes out',
          `${'∑'}${dfn('Re')}[${dv('A')}${dop('_')}${dv('k')}${dfn('e')}^(iφ${dop('_')}${dv('k')}) ${dfn('e')}^(iω${dv('t')})] ${dop('=')} ${dfn('Re')}[(${'∑'}${dv('A')}${dop('_')}${dv('k')}${dfn('e')}^(iφ${dop('_')}${dv('k')})) ${dfn('e')}^(iω${dv('t')})]`,
          `the bracket is one complex number: ${cnFmt(S.z, 6)}`),
        drvSay('so the whole problem collapses to adding a few arrows',
          'The time dependence never entered the sum. That is the entire trick, and it works only because every wave has the <em>same</em> ω — with two different frequencies the common factor cannot be taken out, and the sum is genuinely not a sinusoid.'),
        drvStep('read the amplitude and phase off the arrow',
          `${dv('A')} ${dop('=')} |${'∑'}|,   φ ${dop('=')} ${dfn('arg')}(${'∑'})`,
          `A = ${fmtNum(S.amp, 8)},  φ = ${ctDeg(S.phase)}`),
        drvStep('and the panel checks that against the wave itself',
          `${dfrac('2', 'T')}${'∫'}${dv('y')}(${dv('t')})${dfn('cos')} ω${dv('t')} ${dop('d')}${dv('t')},   ${dop('−')}${dfrac('2', 'T')}${'∫'}${dv('y')}(${dv('t')})${dfn('sin')} ω${dv('t')} ${dop('d')}${dv('t')}`,
          `fitted ${cnFmt(S.fitted, 8)} — ${fmtGap(S.gap, S.gross)}`),
        drvSay('the second route is a quadrature, and it is the good kind',
          'A trapezoid rule on a periodic integrand sampled over a whole period is spectrally accurate — its error falls faster than any power of the step. That is why 2048 samples agree with exact arithmetic to the last bit here, and it is the one situation where the simplest rule is also the best one.'),
        drvSay('the same-frequency hypothesis is the whole of it, and it does fail',
          'Everything above turned on e^(iωt) being common to every term. Give two waves different frequencies and there is no common factor to remove: the sum is not a sinusoid at all, its envelope rises and falls, and what you hear is beats at the difference frequency. So this is not a general method for adding oscillations — it is an exact method for one frequency at a time. The reason it is nonetheless everywhere is that a linear system driven at one frequency responds at that frequency, which is precisely what "linear" buys you.'),
        drvSay('and this is where impedance comes from',
          'Differentiating a phasor multiplies it by iω, and integrating divides by it. So on a single-frequency signal, d/dt stops being an operator and becomes a number — which turns the differential equation of an RLC circuit into ordinary algebra with resistance R, inductance iωL and capacitance 1/(iωC). The complex number that results is the impedance, its modulus is the amplitude ratio and its argument is the phase lag. The circuits wing does exactly this, and it is nothing more than the factorisation on this panel used once per component.')
      ],
      note:'Same ω is the hypothesis. Everything above fails the moment two frequencies differ.'
    };
  },
  readout(st){
    const Pz = this.parts(st), S = cnPhasorSum(Pz.list);
    const rows = Pz.list.map((p, k) => kv('wave ' + (k + 1),
      'A = ' + fmtNum(p.amp, 5) + '   at ' + ctDeg(p.phase))).join('');
    /* when the arrows close, there is no direction left to report: the argument
       of a vector of length 1e-16 is the argument of round-off */
    const gone = S.amp <= 1e-12 * S.gross;
    return `<div class="card tight"><div class="ttl">${esc(Pz.name)}</div>
      ${rows}
      ${kv('the arrow sum', gone ? '0 — the arrows close into a loop' : cnFmt(S.z, 8))}
      ${kv('amplitude', gone
        ? '0 — against ' + fmtNum(S.gross, 4) + ' of amplitude that cancelled'
        : fmtNum(S.amp, 8))}
      ${kv('phase', gone ? 'not defined — a zero vector points nowhere' : ctDeg(S.phase))}
    </div>
    <div class="card tight"><div class="ttl">Against the summed wave itself</div>
      ${kv('fitted from the wave', cnFmt(S.fitted, 8))}
      ${kv('difference', fmtAgreeGross(cxAbs(S.z), cxAbs(S.fitted), S.gross))}
      ${kv('sum of the amplitudes', fmtNum(S.gross, 6) + '  — what the arrows would give if aligned')}
      <p class="help">The gross row is why the cancelling case still means something: when the arrows
      close into a loop the sum is zero, and a difference of 10⁻¹⁶ has to be read against the size of
      the things that cancelled, not against zero.</p>
      <p class="help">${st.fkey === 'custom' ? 'Your own three waves.' : CN_PHASORS[st.fkey].why}</p>
    </div>`;
  },
  chip(st){
    const S = cnPhasorSum(this.parts(st).list);
    /* An amplitude of 4×10⁻¹⁶ is zero, and a phase of 123.7° computed from it is
       the argument of round-off — a direction read off a vector that is not
       there. The three-phase preset produces exactly that, and it is the point
       of the preset, so the chip has to say it rather than print a number. */
    const gone = S.amp <= 1e-12 * S.gross;
    return `<div class="k">the sum</div>
      <div style="color:var(--c-warn)">${gone ? 'A = 0 — they cancel' : 'A = ' + fmtNum(S.amp, 4)}</div>
      <div style="color:var(--c-dim)">${gone ? 'no phase to have' : 'at ' + ctDeg(S.phase)}</div>`;
  },
  legend(st){
    const L = [['var(--c-pos)', 'the first wave, and its arrow'],
               ['var(--c-neg)', 'the second'], ['var(--c-curl)', 'the third, if there is one'],
               ['var(--c-warn)', 'the sum — one arrow, one wave']];
    return L;
  },
  dockLegend:true
};
