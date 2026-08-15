/* ============================================================================
   4z · NUCLEAR PHYSICS
   The binding-energy curve built term by term from the liquid-drop model and
   scored against measured nuclides; decay integrated rather than quoted; and
   the exponential barrier that makes half-lives span twenty-four orders.
   ============================================================================ */

STAGES.ncBind = {
  title:'The binding-energy curve',
  legend(){ return [['var(--text)', 'the five-term model, minimised over Z'],
                    ['var(--c-neg)', 'measured B/A (AME2020), and the stable Z/A line'],
                    ['var(--c-warn)', 'the volume term, and the marker'],
                    ['var(--c-curl)', 'the surface term'],
                    ['var(--c-grad)', 'the Coulomb term'],
                    ['var(--c-pos)', 'the asymmetry term']]; },
  dockLegend:true,
  drag:true,
  enter(st, o){
    st.A = o.A || 56;
    st.showTerms = o.showTerms === true;
    st.valley = o.valley === true;
    st.own = !!o.own;
    st.rx = o.rx || 'U235 + n → Ba141 + Kr92 + 3n';
    st.rxErr = '';
  },
  /* the reader's own reaction, parsed and its Q summed from masses */
  react(st){
    if(st._rk === st.rx) return st._rd;
    st._rk = st.rx;
    const P = ncParseReaction(st.rx);
    st._rd = P.ok ? { ok:true, R:P, Q:ncReactionQ(P) } : { ok:false, errs:P.errs };
    return st._rd;
  },
  controls(){
    const st = ST;
    if(st.own){
      const D = STAGES.ncBind.react(st);
      return ctSeg('nbMode', 'react', [['curve', 'the binding curve'], ['react', 'write your own reaction']]) +
        `<div class="fld" style="align-items:stretch">
          <textarea id="nbRx" rows="3" spellcheck="false" autocomplete="off"
            aria-label="a nuclear reaction, reactants then an arrow then products"
            data-audit="d + t → He4 + n"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.rx)}</textarea>
        </div>
        <div class="row wrap"><button class="btn sm pri" id="nbRxGo">Work it out</button></div>
        <p class="help" id="nbRxMsg" style="color:${st.rxErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.rxErr ||
          'Reactants, an arrow, products: <b>U235 + n → Ba141 + Kr92 + 3n</b>. Write a nuclide as a symbol ' +
          'with its mass number either way round (<b>U235</b> or <b>235U</b>), and <b>n p d t alpha</b> for the ' +
          'light particles. A leading number is a count — <b>3n</b> is three neutrons, while <b>4He</b> is ' +
          'helium-4, because <i>He</i> alone is not a species and <i>n</i> is.'}</p>
        <p class="help">Nothing here has a table of Q-values to look the answer up in. Each nuclide's mass is
        <b>built</b> from its binding energy — M = Z·m<sub>H</sub> + N·m<sub>n</sub> − B — and Q is the
        difference between the two sides. Two things then get checked that a printed reaction never has to
        justify: whether it <b>balances</b> in Z and A at all, and whether each B was <b>measured</b> or only
        predicted by the liquid-drop model. Both are reported below.</p>` +
        (D ? '' : '');
    }
    return ctSeg('nbMode', 'curve', [['curve', 'the binding curve'], ['react', 'write your own reaction']]) +
      ctlRow('mass A', ctlSlider('nbA', 2, 260, 1, st.A)) +
      ctChk('nbT', 'break into the five terms', st.showTerms) +
      ctChk('nbV', 'follow the valley of stability', st.valley) +
      `<p class="help">The curve is <b>computed</b>, not drawn: at each A the model is minimised
      over Z, and the result plotted against the measured binding energies of real nuclides (the
      dots). Everything nuclear energy does is on this one curve.</p>
      <p class="help"><b>Drag</b> to move the marker. Fusion runs <i>up</i> the left-hand slope,
      fission runs <i>up</i> the right-hand one, and they meet at the peak near iron — which is why
      that peak is where stars stop.</p>`;
  },
  wire(){
    ctWireSeg('nbMode', v => { ST.own = (v === 'react'); });
    if(ST.own){
      const apply = () => {
        const box = $('nbRx'); if(!box) return;
        ST.rx = box.value;
        const D = STAGES.ncBind.react(ST);
        ST.rxErr = D.ok ? '' : '⚠ ' + D.errs.slice(0, 3).map(e => e.msg).join('<br>⚠ ');
        const msg = $('nbRxMsg');
        if(msg){
          msg.innerHTML = ST.rxErr || (D.Q.balanced
            ? 'Balanced. Q = ' + fmtNum(D.Q.Q, 5) + ' MeV, ' + (D.Q.Q > 0 ? 'released' : 'absorbed') + '.'
            : '⚠ This does not balance: Z is out by ' + D.Q.dZ + ' and A by ' + D.Q.dA +
              '. The Q below is what the arithmetic gives, and it is meaningless until it does.');
          msg.style.color = (ST.rxErr || !D.Q || !D.Q.balanced) ? 'var(--c-neg)' : 'var(--faint)';
        }
        refreshStageReadout(); updateStageChip();
      };
      const b = $('nbRx'); if(b) b.addEventListener('change', apply);
      const g = $('nbRxGo'); if(g) g.addEventListener('click', apply);
      return;
    }
    wireSlider('nbA', () => ST.A, v => { ST.A = Math.round(v); }, v => String(Math.round(+v)));
    ctWireChk('nbT', v => { ST.showTerms = v; });
    ctWireChk('nbV', v => { ST.valley = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.A = Math.max(2, Math.min(260, Math.round(st.P.invX(sx))));
  },
  frame(st, dt, ctx, W, H){
    const P = mkPlot(80, 55, W - 170, H - 145, 0, 260, 0, 10);
    st.P = P;
    plotFrame(ctx, P, 'mass number A', 'binding energy per nucleon (MeV)',
              st.own ? 'your reaction, drawn on the curve it moves along'
                     : 'the most bound nucleus is ⁶²Ni, and the curve falls away on both sides');
    ctGrid(ctx, P);
    if(st.own){
      /* the model curve, then the reaction as a move along it */
      const cp = [];
      for(let A = 2; A <= 260; A++){
        const Z = Math.round(ncValleyZ(A));
        cp.push({ x:A, y:Math.max(0, ncSemf(Math.max(1, Math.min(A - 1, Z)), A).perA) });
      }
      ctPath(ctx, P, cp, rgbCss(TH.text, 0.55), 2.2);
      const D = STAGES.ncBind.react(st);
      if(!D.ok){
        ctText(ctx, W / 2, H / 2, D.errs[0] ? D.errs[0].msg.replace(/<[^>]*>/g, '') : 'unreadable',
               rgbCss(TH.neg), '600 13px ' + FONT_UI, 'center');
        return;
      }
      /* every nuclide on both sides, at its own B/A. Reactants below, products
         above — because a reaction that releases energy moves UP this curve, and
         that is the single most useful thing the picture can show. */
      const draw = (parts, col, tag) => {
        for(const p of parts){
          if(p.A < 2) continue;                      // a free nucleon has no B/A
          const y = p.B / p.A;
          ctDot(ctx, P, p.A, y, 6, rgbCss(col), rgbCss(TH.bg));
          ctText(ctx, P.X(p.A) + 8, P.Y(y) + (tag === 'in' ? 14 : -8),
                 (p.k > 1 ? p.k + '× ' : '') + (NC_ELEMENTS[p.Z] || '?') + p.A +
                 (p.src === 'model' ? ' (model)' : ''),
                 rgbCss(col), '11px ' + FONT_UI);
        }
      };
      draw(D.Q.L.parts, TH.neg, 'in');
      draw(D.Q.P.parts, TH.pos, 'out');
      /* the arrow from the heaviest reactant to the heaviest product */
      const big = a => a.filter(p => p.A >= 2).sort((x, y) => y.A - x.A)[0];
      const a0 = big(D.Q.L.parts), a1 = big(D.Q.P.parts);
      if(a0 && a1) ctArrow(ctx, P, a0.A, a0.B / a0.A, a1.A, a1.B / a1.A, rgbCss(TH.warn), 2.4, null);
      stageNote(ctx, D.Q.balanced
        ? 'red is what goes in, green is what comes out — energy is released when the products sit HIGHER on this curve'
        : 'this reaction does not balance, so the arrow and the Q below describe nothing physical', W, H);
      return;
    }

    if(st.showTerms){
      /* each term divided by A, so it can be read against the same axis */
      const parts = [['volume', TH.warn], ['surface', TH.curl], ['coulomb', TH.grad],
                     ['asymmetry', TH.pos]];
      parts.forEach(([k, col], i) => {
        ctx.save(); ctx.globalAlpha = 0.55;
        const pts = [];
        for(let A = 2; A <= 260; A += 2){
          const Z = Math.round(ncValleyZ(A));
          const s = ncSemf(Math.max(1, Z), A);
          pts.push({ x:A, y:Math.max(-2, Math.min(20, s[k] / A)) });
        }
        ctPath(ctx, P, pts, rgbCss(col), 1.6, [6, 4]);
        ctx.restore();
      });
    }
    /* the model curve */
    const pts = [];
    for(let A = 2; A <= 260; A++){
      const Z = Math.round(ncValleyZ(A));
      const s = ncSemf(Math.max(1, Math.min(A - 1, Z)), A);
      pts.push({ x:A, y:Math.max(0, s.perA) });
    }
    ctPath(ctx, P, pts, rgbCss(TH.text), 2.8);

    /* the measured nuclides — the model has to answer to these */
    for(const N of NC_NUCLIDES){
      const x = P.X(N.A), y = P.Y(N.bpa);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 7);
      ctx.fillStyle = rgbCss(TH.neg, 0.95); ctx.fill();
      ctx.strokeStyle = rgbCss(TH.bg, 0.9); ctx.lineWidth = 1.2; ctx.stroke();
    }
    /* label the two that matter */
    for(const N of NC_NUCLIDES){
      if(N.s === '⁵⁶Fe' || N.s === '²³⁵U' || N.s === '⁴He')
        ctText(ctx, P.X(N.A) + 7, P.Y(N.bpa) - 8, N.s, rgbCss(TH.neg), '12px ' + FONT_UI);
    }

    if(st.valley){
      /* The stable proton fraction on the same axis, rescaled: it starts at 0.5
         (N = Z) and bends down as Coulomb repulsion forces a neutron excess.
         The vertical range 0 to 10 stands in for a ratio of 0.3 to 0.55. */
      const rescale = r => (r - 0.3) / 0.25 * 10;
      ctPath(ctx, P, Array.from({ length:130 }, (_, i) => {
        const A = 2 + 258 * i / 129;
        return { x:A, y:rescale(ncValleyZ(A) / A) };
      }), rgbCss(TH.neg), 2.2, [7, 4]);
      /* the N = Z line it departs from */
      ctPath(ctx, P, [{ x:0, y:rescale(0.5) }, { x:260, y:rescale(0.5) }],
             rgbCss(TH.neg, 0.45), 1.4, [3, 4]);
      ctText(ctx, P.X(6), P.Y(rescale(0.5)) - 6, 'N = Z', rgbCss(TH.neg), '11px ' + FONT_UI);
      ctText(ctx, P.X(150), P.Y(rescale(ncValleyZ(150) / 150)) - 10, 'stable Z/A (right)',
             rgbCss(TH.neg), '11px ' + FONT_UI);
    }

    const Zs = Math.round(ncValleyZ(st.A));
    const S = ncSemf(Math.max(1, Math.min(st.A - 1, Zs)), st.A);
    probeLine(ctx, P, st.A, 'A = ' + st.A);
    ctx.beginPath(); ctx.arc(P.X(st.A), P.Y(Math.max(0, S.perA)), 6, 0, 7);
    ctx.fillStyle = rgbCss(TH.warn); ctx.fill();
    stageNote(ctx, st.valley
      ? 'red dashed is the stable proton fraction — it starts at one half and bends down as Coulomb repulsion demands more neutrons'
      : (st.showTerms
        ? 'dashed: volume (up), surface, Coulomb and asymmetry (all down) — the peak is where they balance'
        : 'dots are measured binding energies; the solid line is the five-term model'), W, H);
  },
  derive(st){
    const Zs = Math.max(1, Math.min(st.A - 1, Math.round(ncValleyZ(st.A))));
    const S = ncSemf(Zs, st.A);
    const n = v => fmtNum(v, 4);
    const brute = ncMostBoundZ(st.A);
    return {
      title:'Where the curve comes from: four competing effects and a parity correction',
      steps:[
        drvSay('start with the simplest possible model',
          'Treat the nucleus as a drop of incompressible liquid. If every nucleon bound equally to its neighbours, the binding energy would be strictly proportional to A and the energy per nucleon would be a constant — a flat line. It is not flat, and every departure from flatness is one of the corrections below.'),
        drvStep('the volume term — the flat line you would guess',
          `${dv('B')}₁ ${dop('=')} ${dv('a')}ᵥ${dv('A')}`,
          `${NC_SEMF.aV} × ${st.A} = ${n(S.volume)} MeV`),
        drvStep('the surface term — the skin has fewer neighbours',
          `${dv('B')}₂ ${dop('=')} ${dop('−')}${dv('a')}ₛ${dv('A')}^(2/3)`,
          `−${NC_SEMF.aS} × ${st.A}^(2/3) = ${n(S.surface)} MeV`),
        drvSay('why the exponent is 2/3',
          'Volume goes as the cube of the radius and surface as its square, while R itself goes as A^(1/3) — the empirical result that nuclear matter has a constant density. So surface area goes as A^(2/3). This term dominates for light nuclei, and it is the entire reason the curve rises steeply at the left.'),
        drvStep('the Coulomb term — every proton repels every other',
          `${dv('B')}₃ ${dop('=')} ${dop('−')}${dv('a')}𝒸${dfrac(dv('Z') + '(' + dv('Z') + '−1)', dv('A') + '^(1/3)')}`,
          `Z = ${Zs}: ${n(S.coulomb)} MeV`),
        drvSay('Z(Z−1), not Z²',
          'There are Z(Z−1)/2 distinct pairs of protons, and a proton does not repel itself. That detail matters for light nuclei: for hydrogen it correctly gives zero. Because this term grows as Z² while binding grows as A, it is what eventually kills every heavy nucleus.'),
        drvStep('the asymmetry term — the exclusion principle prefers N = Z',
          `${dv('B')}₄ ${dop('=')} ${dop('−')}${dv('a')}ₐ${dfrac('(' + dv('N') + '−' + dv('Z') + ')²', dv('A'))}`,
          `N − Z = ${S.N - S.Z}: ${n(S.asymmetry)} MeV`),
        drvSay('this one is quantum mechanical, not classical',
          'Protons and neutrons fill separate ladders of levels. Moving a nucleon from the shorter ladder to the longer one means putting it above the filled levels, which costs energy — and the cost is quadratic in the imbalance. The Coulomb term pushes towards fewer protons and this term pushes back towards equality; the compromise is the valley of stability.'),
        drvStep('the pairing term — nucleons couple in pairs',
          `${dv('B')}₅ ${dop('=')} ${dop('±')}${dv('a')}ₚ/√${dv('A')}`,
          `${S.Z % 2 === 0 && S.N % 2 === 0 ? 'even–even, bound extra' : (S.Z % 2 && S.N % 2 ? 'odd–odd, bound less' : 'odd A, no correction')}: ${n(S.pairing)} MeV`),
        drvStep('add them up',
          `${dv('B')} ${dop('=')} ${dv('B')}₁ ${dop('+')} ${dv('B')}₂ ${dop('+')} ${dv('B')}₃ ${dop('+')} ${dv('B')}₄ ${dop('+')} ${dv('B')}₅`,
          `${n(S.total)} MeV total, ${n(S.perA)} MeV per nucleon`),
        drvStep('and minimise over Z at fixed A to find the stable isotope',
          `${dv('Z')}* ${dop('=')} ${dfrac('4' + dv('a') + 'ₐ + ' + dv('a') + '𝒸' + dv('A') + '^(−1/3)', '8' + dv('a') + 'ₐ/' + dv('A') + ' + 2' + dv('a') + '𝒸' + dv('A') + '^(−1/3)')}`,
          `formula gives ${n(ncValleyZ(st.A))}, brute-force search gives ${brute.Z} — the algebra checks out`)
      ],
      note:'Five terms, fitted long before anyone could solve the nuclear many-body problem, and they still predict the binding energy of most nuclei to better than 1%. What they miss are the magic numbers — the shell effects that show up as the dots sitting above the line near A = 56 and A = 208.'
    };
  },
  readout(st){
    if(st.own){
      const D = STAGES.ncBind.react(st);
      if(!D.ok) return `<div class="card tight"><div class="ttl">That reaction cannot be read</div>
        ${D.errs.slice(0, 4).map(e => kv('', e.msg)).join('')}
        <p class="help">The form is <b>reactants → products</b>, terms separated by <b>+</b>. Nothing is
        computed until it reads, because a Q-value for a reaction nobody can identify is not a number worth
        printing.</p></div>`;
      const Q = D.Q;
      const row = p => kv((p.k > 1 ? p.k + ' × ' : '') + (NC_ELEMENTS[p.Z] || '?') + '-' + p.A,
        fmtNum(p.m, 4) + ' MeV' + (p.src === 'model' ? '  (modelled)' : ''));
      return `<div class="card tight"><div class="ttl">Does it balance?</div>
        ${kv('protons in / out', Q.L.Z + ' / ' + Q.P.Z)}
        ${kv('nucleons in / out', Q.L.A + ' / ' + Q.P.A)}
        ${kv('verdict', Q.balanced ? '✓ charge and mass number both conserved'
                                   : '✗ Z is out by ' + Q.dZ + ', A by ' + Q.dA)}
        <p class="help">${Q.balanced
          ? 'A printed reaction balances because whoever printed it made it balance. This one was checked — and until it does, no Q-value below means anything, because the two sides are not describing the same collection of nucleons.'
          : '<b>Everything below is arithmetic on two sides that are not the same stuff.</b> Fix the balance first: the missing nucleons have to go somewhere, and in fission they are the free neutrons that make the chain reaction possible.'}</p>
      </div>
      <div class="card tight"><div class="ttl">Q, summed from masses</div>
        ${Q.L.parts.map(row).join('')}
        ${kv('total in', '<b>' + fmtNum(Q.L.m, 4) + ' MeV</b>')}
        ${Q.P.parts.map(row).join('')}
        ${kv('total out', '<b>' + fmtNum(Q.P.m, 4) + ' MeV</b>')}
        ${kv('Q = in − out', '<b>' + fmtNum(Q.Q, 5) + ' MeV</b>  ' + (Q.Q > 0 ? '(released)' : '(absorbed)'))}
        ${kv('per nucleon in', fmtNum(Q.perNucleon, 5) + ' MeV')}
        ${kv('masses from the model', Q.modelled + ' of ' + (Q.L.parts.length + Q.P.parts.length))}
        <p class="help">Each mass is <b>M = Z·m<sub>H</sub> + N·m<sub>n</sub> − B</b>, with B measured where
        the nuclide is in the AME2020 table and predicted by the liquid-drop model otherwise. ${Q.modelled
          ? '<b>' + Q.modelled + ' of these masses are modelled</b>, so treat this Q as good to a few MeV rather than to the five figures printed — the model is a five-parameter fit and is wrong by an MeV or two per nucleus, which is small next to 200 MeV and large next to 17.'
          : 'Every mass here is measured, so this Q is a real number and not an estimate.'} Atomic masses are used throughout, so the electrons cancel on both sides of any reaction that conserves Z — which is why β⁻ decay needs no electron term.</p>
      </div>
      <div class="card tight"><div class="ttl">Where the energy comes from</div>
        ${kv('B/A in (weighted)', fmtNum(Q.L.parts.reduce((a, p) => a + p.k * p.B, 0) / Math.max(1, Q.L.A), 5) + ' MeV')}
        ${kv('B/A out (weighted)', fmtNum(Q.P.parts.reduce((a, p) => a + p.k * p.B, 0) / Math.max(1, Q.P.A), 5) + ' MeV')}
        <p class="help">Q is nothing but the change in total binding energy, so a reaction releases energy
        exactly when its products are <b>more tightly bound</b> — higher on the curve above. That is why both
        fusion of light nuclei and fission of heavy ones give energy out while nothing in between does: the
        curve has a maximum near iron, and you can only run uphill towards it from either side. Stars stop
        there for the same reason.</p>
      </div>`;
    }
    const Zs = Math.max(1, Math.min(st.A - 1, Math.round(ncValleyZ(st.A))));
    const S = ncSemf(Zs, st.A);
    /* the nearest measured nuclide, so the model can be scored */
    let best = NC_NUCLIDES[0];
    for(const N of NC_NUCLIDES) if(Math.abs(N.A - st.A) < Math.abs(best.A - st.A)) best = N;
    const err = Math.abs(best.bpa - ncSemf(best.Z, best.A).perA);
    /* the peak, found rather than quoted */
    let pk = { A:2, v:-1 };
    for(let A = 2; A <= 260; A++){
      const v = ncSemf(Math.max(1, Math.round(ncValleyZ(A))), A).perA;
      if(v > pk.v) pk = { A, v };
    }
    return `<div class="card tight"><div class="ttl">A = ${st.A}, most stable Z = ${Zs}</div>
      ${kv('binding energy', fmtNum(S.total, 4) + ' MeV')}
      ${kv('per nucleon', fmtNum(S.perA, 4) + ' MeV')}
      ${kv('neutrons N', String(S.N))}
      ${kv('N/Z ratio', fmtNum(S.N / Math.max(1, Zs), 4))}
      <p class="help">Light nuclei sit near N = Z. Heavy ones need a neutron excess, because
      neutrons add binding without adding Coulomb repulsion — that rising N/Z ratio is the
      valley of stability bending away from the diagonal.</p>
    </div>
    <div class="card tight"><div class="ttl">The five terms, in MeV</div>
      ${S.terms.map(t => kv(t.n, fmtNum(t.v, 3))).join('')}
      ${kv('sum', fmtNum(S.total, 3))}
      <p class="help">Volume is the only positive one. Everything else is a correction that costs
      binding, and the curve's shape is entirely the story of which correction is winning.</p>
    </div>
    <div class="card tight"><div class="ttl">Scored against nature</div>
      ${kv('nearest measured', best.s + ' at ' + fmtNum(best.bpa, 4) + ' MeV/A')}
      ${kv('model says', fmtNum(ncSemf(best.Z, best.A).perA, 4) + ' MeV/A')}
      ${kv('disagreement', fmtNum(err, 4) + ' MeV/A (' + fmtNum(100 * err / best.bpa, 2) + '%)')}
      ${kv('model peak at', 'A = ' + pk.A + ', ' + fmtNum(pk.v, 4) + ' MeV/A')}
      ${kv('measured peak', '⁶²Ni at 8.7945 MeV/A')}
      <p class="help">The peak is found by scanning the model, not read off a table. That the
      liquid-drop model lands within a few units of A of the true maximum — with no quantum
      mechanics in it at all — is the reason it survived.</p>
    </div>`;
  },
  chip(st){
    const Zs = Math.max(1, Math.min(st.A - 1, Math.round(ncValleyZ(st.A))));
    if(st.own){
      const D = STAGES.ncBind.react(st);
      if(!D.ok) return `<div class="k">your reaction</div><div style="color:var(--c-neg)">cannot be read</div>`;
      return `<div class="k">your reaction</div>
        <div style="color:${D.Q.balanced ? 'var(--c-grad)' : 'var(--c-neg)'}">${D.Q.balanced ? 'balanced' : 'does NOT balance'}</div>
        <div>Q = ${fmtNum(D.Q.Q, 4)} MeV</div>`;
    }
    return `<div class="k">A = ${st.A}, Z = ${Zs}</div><div>${fmtNum(ncSemf(Zs, st.A).perA, 3)} MeV/nucleon</div>`;
  }
};

/* ------------------------------------------------------------------------- */
/* One colour per member of a typed chain. Seven distinguishable hues, and a
   dashed pen for the eighth onwards, because ten solid lines of seven colours
   would put two identical curves on the same picture. */
const NC_CHAIN_HUE = ['grad', 'warn', 'curl', 'pos', 'neg', 'accent', 'text'];
const NC_CHAIN_VAR = ['var(--c-grad)', 'var(--c-warn)', 'var(--c-curl)', 'var(--c-pos)',
                      'var(--c-neg)', 'var(--accent)', 'var(--text)'];
const ncChainCol  = i => TH[NC_CHAIN_HUE[i % 7]];
const ncChainDash = i => (i >= 7 ? [7, 4] : null);

STAGES.ncDecay = {
  title:'Decay, and the chain that follows it',
  legend(st){
    if(st && st.own){
      const D = STAGES.ncDecay.chainOf(st);
      if(D.ok) return D.P.members.map((m, i) => [NC_CHAIN_VAR[i % 7], m.name + (m.stable ? ' (stable)' : ', T½ ' + ncTime(m.half))]);
      return [['var(--c-neg)', 'the chain as written cannot be read']];
    }
    return [['var(--c-grad)', 'the parent, N = N₀e^(−λt)'],
            ['var(--c-warn)', 'the daughter, when a chain is shown'],
            ['var(--c-curl)', 'the stable end product']];
  },
  dockLegend:true,
  enter(st, o){
    st.i = o.i || 3;
    st.t = 0;
    st.chain = o.chain || false;
    st.ratio = o.ratio || 8;      // daughter half-life as a fraction of parent's
    st.run = true;
    st.own = !!o.own;
    st.chsrc = o.chsrc || 'Pb212  10.64 h\nBi212  60.55 min\nPo212  0.299 us\nPb208  stable';
    st.chErr = '';
    st.lt = null;                 // log₁₀ of the marker time, set on the first frame
  },
  /* Everything the typed chain needs, computed once per edit. Two solves, a
     six-hundred-point scan for the maxima and a sixty-thousand-step integration
     is not a per-frame cost, and the readout is called four times a second. */
  chainOf(st){
    if(st._ck === st.chsrc) return st._cd;
    st._ck = st.chsrc;
    const P = ncParseChain(st.chsrc);
    if(!P.ok){ st._cd = { ok:false, P }; return st._cd; }
    const L = P.lams;
    const W = ncChainWindow(L);
    /* the drawing window: from a fiftieth of the fastest member's mean life out
       to ten of the slowest's, which is every part of the story and no more */
    const pos = L.filter(l => l > 0);
    const x0 = Math.log10(0.02 / Math.max.apply(null, pos));
    const x1 = Math.log10(10 / Math.min.apply(null, pos));
    const curve = [];
    let lowest = 0;
    for(let i = 0; i <= 260; i++){
      const lx = x0 + (x1 - x0) * i / 260;
      const N = ncBateman(L, Math.pow(10, lx));
      curve.push({ lx, N });
      for(const v of N) if(v > 1e-300) lowest = Math.min(lowest, Math.log10(v));
    }
    /* the floor of the vertical axis: low enough to show the least-populated
       member, but never so low that the picture is mostly empty decades */
    const peaks = L.map((_, k) => curve.reduce((a, c) => Math.max(a, c.N[k]), 0));
    const y0 = Math.max(-20, Math.min(-1.2, Math.log10(Math.max(1e-20,
                 peaks.reduce((a, v) => Math.min(a, v > 0 ? v : a), 1))) - 1.4));
    const tm = Math.pow(10, (x0 + x1) / 2);
    st._cd = { ok:true, P, L, W, x0, x1, y0, curve, peaks,
               cmp:ncChainCompare(L, tm, 20000), tm,
               maxima:ncChainMaxima(L), eq:ncChainEquilibrium(L) };
    return st._cd;
  },
  controls(){
    const st = ST, D = NC_DECAYS[st.i];
    const seg = ctSeg('ndM', st.own ? 'own' : 'list',
                      [['list', 'a decay from the list'], ['own', 'build your own chain']]);
    if(st.own)
      return seg +
        `<div class="fld" style="align-items:stretch">
          <textarea id="ndCh" rows="7" spellcheck="false" autocomplete="off"
            aria-label="a decay chain — one nuclide per line: name, half-life, unit; the last must be stable"
            data-audit="A  4000 y&#10;B  30 d&#10;C  9 h&#10;D  stable"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.chsrc)}</textarea>
        </div>
        <div class="row wrap">${ctBtn('ndChGo', 'Solve it')}${ctBtn('ndG', st.run ? 'pause' : 'run')}</div>
        <p class="help" id="ndChMsg" style="color:${st.chErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.chErr ||
          'One nuclide per line: a name, a half-life, a unit. Units are <b>ns µs ms s min h d y ky My Gy</b>, ' +
          'and the last line must read <b>stable</b> — every real series ends on one. Both axes are logarithmic, ' +
          'so a chain spanning ten hours to a third of a microsecond fits on one picture.'}</p>
        <p class="help">Two solutions are computed and compared. <b>Bateman's closed form</b> expands the
        chain in partial fractions — it steps nothing, and it subtracts nearly equal numbers, so the panel
        also reports how many digits it loses doing so. The <b>stepped</b> solution integrates
        dN<sub>k</sub>/dt = λ<sub>k−1</sub>N<sub>k−1</sub> − λ<sub>k</sub>N<sub>k</sub> directly, advancing
        each member by the exact solution of its own equation over the step, which is why ²¹²Po at a third
        of a microsecond under a ten-hour parent does not need 10¹¹ steps. Their disagreement is printed,
        and so is the integrator's order, measured by halving.</p>
        <p class="help">Then two things a printed chain gets to assume are checked. A daughter's
        <b>maximum</b> is located by maximising its population and, separately, by solving
        λ<sub>k−1</sub>N<sub>k−1</sub> = λ<sub>k</sub>N<sub>k</sub> — two calculations with nothing in
        common, agreeing only if "a daughter peaks when its activity matches its parent's" is true. And the
        <b>equilibrium</b> ratios are measured late in the chain's life and set against ∏λ<sub>i</sub>/(λ<sub>i</sub>−λ<sub>1</sub>),
        with secular equilibrium appearing as the limit of that product rather than as a separate rule.</p>`;
    return seg +
      ctSeg('ndI', String(st.i), NC_DECAYS.map((d, i) => [String(i), d.s])) +
      ctChk('ndC', 'follow the daughter as well (a decay chain)', st.chain) +
      (ST.chain ? ctlRow('T½ ratio', ctlSlider('ndR', 0.05, 20, 0.05, st.ratio)) : '') +
      ctBtn('ndG', st.run ? 'pause' : 'run') + ctBtn('ndZ', 'restart') +
      `<p class="help">${esc(D.use)}. Half-life ${ncTime(D.half)}, Q = ${D.Q} MeV.</p>
      <p class="help">The horizontal axis is measured <b>in half-lives</b>, which is what makes
      every decay in the list look identical — the only physics in the exponential law is the one
      constant λ, and dividing it out leaves the same curve every time.</p>`;
  },
  wire(){
    ctWireSeg('ndM', v => { ST.own = (v === 'own'); ST.t = 0; ST.lt = null; });
    ctWireBtn('ndG', () => { ST.run = !ST.run; buildStagePanel(); });
    if(ST.own){
      const apply = () => {
        const box = $('ndCh'); if(!box) return;
        ST.chsrc = box.value;
        ST.lt = null;
        const D = STAGES.ncDecay.chainOf(ST);
        ST.chErr = D.ok ? '' :
          '⚠ ' + D.P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
          '<br><span style="color:var(--faint)">The previous chain is still shown.</span>';
        const msg = $('ndChMsg');
        if(msg){
          msg.innerHTML = ST.chErr || ('Solved: ' + D.P.members.length + ' members, ' +
            D.maxima.length + ' of them with a maximum to find.');
          msg.style.color = ST.chErr ? 'var(--c-neg)' : 'var(--faint)';
        }
        refreshStageReadout(); updateStageChip(); updateStageLegend();
      };
      const b = $('ndCh'); if(b) b.addEventListener('change', apply);
      const g = $('ndChGo'); if(g) g.addEventListener('click', apply);
      return;
    }
    ctWireSeg('ndI', v => { ST.i = +v; ST.t = 0; });
    ctWireChk('ndC', v => { ST.chain = v; buildStagePanel(); });
    wireSlider('ndR', () => ST.ratio, v => { ST.ratio = v; }, v => fmtNum(+v, 2) + '×');
    ctWireBtn('ndZ', () => { ST.t = 0; });
  },
  /* the typed chain: both axes logarithmic, because a real series spans fourteen
     decades of time and eleven of population and nothing linear can hold it */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.ncDecay.chainOf(st);
    if(!D.ok){
      ctText(ctx, W / 2, H / 2 - 10, 'That chain cannot be read', rgbCss(TH.neg), '600 14px ' + FONT_UI, 'center');
      ctText(ctx, W / 2, H / 2 + 14,
             (D.P.errs[0] ? D.P.errs[0].msg.replace(/<[^>]*>/g, '') : '').slice(0, 96),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    if(st.lt === null || !Number.isFinite(st.lt)) st.lt = D.x0;
    if(st.run){
      st.lt += dt * (D.x1 - D.x0) / 16;
      if(st.lt > D.x1) st.lt = D.x0;
    }
    const P = mkPlot(80, 55, W - 170, H - 145, D.x0, D.x1, D.y0, 0.4);
    st.P = P;
    plotFrame(ctx, P, 'log₁₀ of time in seconds', 'log₁₀ of the fraction left',
              'your chain, solved in closed form and stepped — and the two compared');
    ctGrid(ctx, P, 1);
    for(let k = 0; k < D.L.length; k++)
      ctPath(ctx, P, D.curve.map(c => ({ x:c.lx, y:c.N[k] > 0 ? Math.log10(c.N[k]) : NaN })),
             rgbCss(ncChainCol(k), 0.95), 2.4, ncChainDash(k));
    /* every maximum, marked where it was found rather than where it was expected */
    for(const m of D.maxima){
      const lx = Math.log10(m.t), ly = Math.log10(Math.max(1e-300, m.N));
      if(lx < D.x0 || lx > D.x1 || ly < D.y0) continue;
      ctPath(ctx, P, [{ x:lx, y:D.y0 }, { x:lx, y:ly }], rgbCss(ncChainCol(m.k), 0.45), 1.3, [4, 3]);
      ctDot(ctx, P, lx, ly, 5, rgbCss(ncChainCol(m.k)), rgbCss(TH.bg));
    }
    /* the equilibrium window, where every activity ratio has stopped changing */
    if(D.eq.ok && Math.log10(D.eq.t) < D.x1){
      const lx = Math.log10(D.eq.t);
      ctPath(ctx, P, [{ x:lx, y:D.y0 }, { x:lx, y:0.4 }], rgbCss(TH.faint, 0.8), 1.4, [8, 5]);
      ctText(ctx, P.X(lx) - 6, P.py + 14, 'ratios settled', rgbCss(TH.faint), '11px ' + FONT_UI, 'right');
    }
    const N = ncBateman(D.L, Math.pow(10, st.lt));
    for(let k = 0; k < D.L.length; k++){
      if(!(N[k] > 0)) continue;
      const ly = Math.log10(N[k]);
      if(ly < D.y0) continue;
      ctDot(ctx, P, st.lt, ly, 5, rgbCss(ncChainCol(k)), rgbCss(TH.bg));
    }
    probeLine(ctx, P, st.lt, ncTime(Math.pow(10, st.lt)));
    stageNote(ctx, 'dashed drops mark each daughter\'s maximum — found by maximising the population, ' +
                   'then confirmed by balancing the activities', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.ncDecay.frameOwn(st, dt, ctx, W, H);
    if(st.run) st.t = Math.min(8, st.t + dt * 0.55);
    const P = mkPlot(80, 55, W - 170, H - 145, 0, 8, 0, 1.05);
    st.P = P;
    plotFrame(ctx, P, 'time, in half-lives', 'fraction remaining',
              st.chain ? 'parent decays, daughter builds up then decays in turn' : 'the exponential law');
    ctGrid(ctx, P);

    /* the halving grid — the visual definition of a half-life */
    for(let k = 1; k <= 4; k++){
      const y = Math.pow(0.5, k);
      ctPath(ctx, P, [{ x:0, y }, { x:k, y }], rgbCss(TH.faint, 0.5), 1, [3, 4]);
      ctPath(ctx, P, [{ x:k, y:0 }, { x:k, y }], rgbCss(TH.faint, 0.5), 1, [3, 4]);
      ctText(ctx, P.X(0) + 6, P.Y(y) - 6, '1/' + Math.pow(2, k), rgbCss(TH.faint), '11px ' + FONT_UI);
    }

    if(!st.chain){
      plotCurve(ctx, P, x => Math.pow(0.5, x), 400, rgbCss(TH.grad), 2.8);
      const y = Math.pow(0.5, st.t);
      ctx.beginPath(); ctx.arc(P.X(st.t), P.Y(y), 6, 0, 7);
      ctx.fillStyle = rgbCss(TH.warn); ctx.fill();
    } else {
      const T1 = 1, T2 = st.ratio;
      plotCurve(ctx, P, x => ncChain(1, T1, T2, x).parent, 400, rgbCss(TH.grad), 2.6);
      plotCurve(ctx, P, x => ncChain(1, T1, T2, x).daughter, 400, rgbCss(TH.warn), 2.6);
      plotCurve(ctx, P, x => ncChain(1, T1, T2, x).stable, 400, rgbCss(TH.curl), 2.2, [6, 4]);
      const pk = ncChainPeak(T1, T2);
      if(pk > 0 && pk < 8){
        const yv = ncChain(1, T1, T2, pk).daughter;
        ctPath(ctx, P, [{ x:pk, y:0 }, { x:pk, y:yv }], rgbCss(TH.warn, 0.5), 1.4, [4, 3]);
        ctText(ctx, P.X(pk) + 6, P.Y(yv) - 10, 'daughter peaks here', rgbCss(TH.warn), '11px ' + FONT_UI);
      }
      const C = ncChain(1, T1, T2, st.t);
      [[C.parent, TH.grad], [C.daughter, TH.warn]].forEach(([v, c]) => {
        ctx.beginPath(); ctx.arc(P.X(st.t), P.Y(v), 5, 0, 7);
        ctx.fillStyle = rgbCss(c); ctx.fill();
      });
    }
    probeLine(ctx, P, st.t, 't = ' + fmtNum(st.t, 2) + ' T½');
    stageNote(ctx, st.chain
      ? 'green parent, orange daughter, purple dashed the stable end product — the three always sum to 1'
      : 'each half-life removes half of what is left, never a fixed amount', W, H);
  },
  derive(st){
    if(st.own) return STAGES.ncDecay.deriveOwn(st);
    const D = NC_DECAYS[st.i];
    const n = v => fmtNum(v, 5);
    const frac = Math.pow(0.5, st.t);
    return {
      title:'From "each nucleus is independent" to the exponential law',
      steps:[
        drvSay('the one physical assumption',
          'A nucleus has no memory and no schedule. In any short interval it has the same probability of decaying whether it was made a second ago or a billion years ago. Nothing ages, nothing wears out — and that single statement forces everything that follows.'),
        drvStep('so the number decaying is proportional to the number present',
          `${dfrac('d' + dv('N'), 'd' + dv('t'))} ${dop('=')} ${dop('−')}λ${dv('N')}`,
          `λ = ln2 / T½ = ${n(ncLambda(1))} per half-life`),
        drvStep('separate the variables and integrate',
          `∫ ${dfrac('d' + dv('N'), dv('N'))} ${dop('=')} ${dop('−')}λ∫ d${dv('t')}`,
          'the separable first-order equation of the differential-equations wing'),
        drvStep('which gives a logarithm on the left',
          `ln ${dv('N')} ${dop('−')} ln ${dv('N')}₀ ${dop('=')} ${dop('−')}λ${dv('t')}`,
          'exponentiate both sides to undo it'),
        drvStep('and the decay law',
          `${dv('N')}(${dv('t')}) ${dop('=')} ${dv('N')}₀${dop('e')}^(−λ${dv('t')})`,
          `at t = ${fmtNum(st.t, 2)} half-lives, ${n(frac)} of the sample is left`),
        drvStep('the half-life is where the exponent equals ln½',
          `${dv('T')}½ ${dop('=')} ${dfrac('ln 2', 'λ')}`,
          `for ${D.s}: ${ncTime(D.half)}`),
        drvSay('why "half" and not some other fraction',
          'Nothing privileges one half. The same law says the sample falls to 1/e in time 1/λ, and to a tenth in T½·log₂10. Half was chosen because it is easy to see. What is genuinely physical is that the time to fall by any given factor is always the same — which is exactly what an exponential means, and what distinguishes it from every other decreasing curve.'),
        st.chain ? drvStep('adding a daughter gives an inhomogeneous equation',
          `${dfrac('d' + dv('N') + '₂', 'd' + dv('t'))} ${dop('=')} λ₁${dv('N')}₁ ${dop('−')} λ₂${dv('N')}₂`,
          `solved by the integrating factor of the ODE wing; peaks at t = ${fmtNum(ncChainPeak(1, st.ratio), 4)} T½`)
          : drvStep('activity is what a detector actually counts',
          `${dv('A')} ${dop('=')} λ${dv('N')} ${dop('=')} λ${dv('N')}₀${dop('e')}^(−λ${dv('t')})`,
          'the same exponential — a counter measures the derivative, not the population'),
        drvSay('the law describes a population, and says nothing about a nucleus',
          'A single nucleus has no schedule, no internal clock and no memory of how long it has already waited: its chance of decaying in the next second is the same today as it was a millennium ago. That memorylessness is what forces the exponential — it is the only distribution with the property — and it is why "half-life" is a statement about a sample rather than about an atom. Radioactivity does not wear out; it is the only genuinely ageless process in nature.'),
        drvSay('so the smooth curve is a limit, and small samples do not obey it',
          'N(t) = N₀e^(−λt) is the <b>mean</b> of a binomial count, and the actual number left fluctuates about it by roughly √N. With 10²³ atoms that fluctuation is invisible; with a hundred it is a third of the signal, and with three it is the whole story. This is why counting statistics dominate every low-activity measurement, why a detector\'s error bars go as √(counts), and why doubling the precision of a radiocarbon date means counting four times as long.'),
        drvSay('and the enormous range of λ has one explanation',
          'Half-lives span from 10⁻²¹ seconds to 10²⁴ years — forty-five orders of magnitude — while the energies involved vary by less than a factor of ten. Nothing linear can do that. The mechanism is tunnelling: the decay rate carries the barrier integral in an <b>exponent</b>, so a modest change in energy is exponentiated into an astronomical change in lifetime. That is the Gamow factor, and the quantum wing\'s tunnelling stage is where it is computed.')
      ],
      note:'This is the same equation as capacitor discharge in the circuit wing, Newtonian cooling in the thermodynamics wing, and drug clearance in pharmacology. "Rate proportional to amount" is one differential equation, and it does not care what is decaying.'
    };
  },
  deriveOwn(st){
    const D = STAGES.ncDecay.chainOf(st);
    const n = v => fmtNum(v, 5);
    if(!D.ok) return {
      title:'The chain as written cannot be read',
      steps:[drvSay('what the sheet has to say',
        'Every line needs a name and a half-life with a unit, and the last line has to read <b>stable</b>. That last rule is not fussiness: without an end product the populations drain away to nothing, and the conservation law that makes the whole calculation checkable — that the members always sum to the number you started with — has nothing to conserve.')],
      note:'Fix the lines listed under the sheet and the ladder returns.'
    };
    const m0 = D.maxima[0];
    return {
      title:'Two solutions of the same chain, and what their disagreement measures',
      steps:[
        drvStep('the chain, as a system rather than as a formula',
          `${dfrac('d' + dv('N') + 'ₖ', 'd' + dv('t'))} ${dop('=')} λₖ₋₁${dv('N')}ₖ₋₁ ${dop('−')} λₖ${dv('N')}ₖ`,
          `${D.P.members.length} coupled equations, one per member of your chain`),
        drvSay('this is the only physics in the whole page',
          'Each member is fed at exactly the rate its parent is decaying and drains at its own rate. Nothing else is assumed: no equilibrium, no peak condition, no ordering of the half-lives. Everything the panel reports below is a consequence of these lines and is computed from them, which is what makes it possible for a claim to come out false.'),
        drvStep('route one — Bateman, in closed form',
          `${dv('N')}ₖ(${dv('t')}) ${dop('=')} (∏ᵢ₍ᵢ₌₁..ₖ₋₁₎ λᵢ) Σⱼ ${dfrac(dop('e') + '^(−λⱼ' + dv('t') + ')', '∏ᵢ₍ᵢ≠ⱼ₎ (λᵢ − λⱼ)')}`,
          `exact, and it steps nothing — but it loses ${n(D.cmp.cancel.digits)} decimal digits to cancellation here`),
        drvSay('why a closed form is not automatically the better one',
          'The sum alternates in sign, and its individual terms carry the reciprocals of differences of decay constants. Two members with similar half-lives make those terms enormous compared with the answer they add up to, and the subtraction throws away digits that no amount of care downstream can recover. The panel reports how many, because "closed form" and "accurate" are different properties and this is where they part company.'),
        drvStep('route two — step the system, exactly within each step',
          `${dv('N')}(${dv('t')}+${dv('h')}) ${dop('=')} ${dv('N')}${dop('e')}^(−λ${dv('h')}) ${dop('+')} λₖ₋₁${dv('h')}[${dv('u')}₀(φ₁−φ₂) ${dop('+')} ${dv('u')}₁φ₂]`,
          `${D.cmp.steps} steps; the measured order is ${Number.isFinite(D.cmp.order) ? n(D.cmp.order) : 'not resolvable here'}`),
        drvSay('and why not Runge–Kutta',
          'An explicit method needs a step short enough for the fastest member and has to take it for as long as the slowest member lives. A chain running from ten hours down to a third of a microsecond would want something like 10¹¹ of them. Solving each member\'s own linear equation exactly across the step removes that constraint entirely: the fast member reaches its steady state within one step and stays there, because that is what its exact solution does.'),
        drvStep('the two routes, differenced',
          `max ₖ |${dv('N')}ₖ^closed ${dop('−')} ${dv('N')}ₖ^stepped|`,
          `${fmtSig(D.cmp.gap, 4)}, against populations of order one`),
        m0 ? drvStep('a daughter\'s maximum, located two ways',
          `${dv('N')}ₖ maximal &nbsp;&nbsp;versus&nbsp;&nbsp; λₖ₋₁${dv('N')}ₖ₋₁ ${dop('=')} λₖ${dv('N')}ₖ`,
          `${ncTime(m0.tMax)} against ${m0.tBal === null ? 'no bracket found' : ncTime(m0.tBal)}`)
          : drvSay('this chain has no interior maximum to find',
          'Every member either starts full and only falls, or is the stable end product and only rises. The peak-finding below has nothing to bite on, which is itself worth seeing: the daughter bump is a consequence of production competing with decay, and a chain arranged so that competition never happens does not produce one.'),
        drvSay('locating a maximum is intrinsically blunter than locating a root',
          'At a maximum the function is flat, so a change of ε in the position costs only ε² in the value, and no search can pin the position better than about the square root of machine precision — a hundred-millionth. The activity balance is a root, where the function crosses steeply, and it is pinned to the last digit. That the two agree to the accuracy the weaker one allows is the theorem holding; expecting better would be expecting arithmetic that does not exist.'),
        drvStep('and the equilibrium ratio the chain settles into',
          `${dfrac(dv('A') + 'ₖ', dv('A') + '₁')} ${dop('→')} ∏ᵢ ${dfrac('λᵢ', 'λᵢ − λ₁')}`,
          D.eq.ok ? `predicted ${n(D.eq.rows[D.eq.rows.length - 1].pred)}, measured to within ${fmtSig(D.eq.off, 3)}`
                  : 'not reached — ' + D.eq.why)
      ],
      note:'Secular equilibrium is not a separate rule. It is what that product becomes when the head is much the longest-lived, and the panel shows the product\'s own distance from one so the approximation can be seen rather than invoked.'
    };
  },
  readout(st){
    if(st.own) return STAGES.ncDecay.readoutOwn(st);
    const D = NC_DECAYS[st.i];
    const n = v => fmtNum(v, 6);
    const frac = Math.pow(0.5, st.t);
    const C = ncChain(1, 1, st.ratio, st.t);
    /* a real sample: one gram of the actual isotope selected, so the activity
       is a number a detector would really register */
    const N0 = NC_NA / D.A;
    const act = ncActivity(N0, D.half, 0);
    return `<div class="card tight"><div class="ttl">${esc(D.s)}</div>
      ${kv('half-life', ncTime(D.half))}
      ${kv('decay constant λ', fmtNum(ncLambda(D.half), 4) + ' s⁻¹')}
      ${kv('mean lifetime 1/λ', ncTime(1 / ncLambda(D.half)))}
      ${kv('Q value', D.Q + ' MeV')}
      ${kv('mode', D.mode)}
      <p class="help">The mean lifetime is <b>longer</b> than the half-life, by a factor
      1/ln2 ≈ 1.443. Half the nuclei are gone by T½, but the survivors carry a long tail, and the
      average has to account for them.</p>
    </div>
    <div class="card tight"><div class="ttl">At t = ${fmtNum(st.t, 3)} half-lives</div>
      ${kv('fraction remaining', n(frac))}
      ${kv('fraction decayed', n(1 - frac))}
      ${kv('elapsed, in real time', ncTime(st.t * D.half))}
      ${st.chain ? kv('parent', n(C.parent)) + kv('daughter', n(C.daughter)) + kv('stable product', n(C.stable)) + kv('the three sum to', n(C.parent + C.daughter + C.stable)) : ''}
      <p class="help">${st.chain
        ? 'The daughter rises while production beats its own decay, then falls once the parent runs out. The peak is where the two rates cross — set the derivative to zero and solve, which is what the panel above does.'
        : 'A single exponential never reaches zero. That is not a mathematical quibble: it is why contamination has no clean end date, only a level you decide to tolerate.'}</p>
    </div>
    <div class="card tight"><div class="ttl">What one gram would read on a counter</div>
      ${kv('nuclei in 1 g (A = ' + D.A + ')', fmtNum(N0, 4))}
      ${kv('initial activity', fmtNum(act, 4) + ' decays/s')}
      ${kv('in becquerel', fmtNum(act, 4) + ' Bq')}
      ${kv('in curie', fmtNum(act / 3.7e10, 4) + ' Ci')}
      <p class="help">Short half-life means high activity: the same number of atoms is far more
      dangerous if it decays quickly. That inverse relation is why the most radioactive substances
      are also the ones that do not last.</p>
    </div>`;
  },
  readoutOwn(st){
    const D = STAGES.ncDecay.chainOf(st);
    if(!D.ok) return `<div class="card tight"><div class="ttl">That chain cannot be read</div>
      ${D.P.errs.slice(0, 5).map(e => kv(e.line ? 'line ' + e.line : '', e.msg)).join('')}
      <p class="help">One nuclide per line — a name, a number, a unit — and <b>stable</b> on the last
      line. Nothing is solved until the whole sheet reads, because a chain with one unreadable member
      is not a chain with a gap in it; it is a different chain.</p></div>`;
    const n = (v, d) => fmtNum(v, d === undefined ? 5 : d);
    const M = D.P.members, C = D.cmp;
    const gapOk = C.rel < 1e-6;
    return `<div class="card tight"><div class="ttl">Your chain, ${M.length} members</div>
      ${M.map((m, i) => kv(m.name, m.stable ? 'stable' : ncTime(m.half) + '  (λ = ' + fmtSig(m.lam, 4) + ' s⁻¹)')).join('')}
      ${kv('rates span', fmtSig(Math.max.apply(null, D.L.filter(l => l > 0)) /
                                Math.min.apply(null, D.L.filter(l => l > 0)), 3) + '×')}
      <p class="help">That span is the whole difficulty. A method with a fixed step has to resolve the
      fastest member and then keep going until the slowest one is finished, and the ratio above is how
      many steps that would take.</p>
    </div>
    <div class="card tight"><div class="ttl">Two solutions, differenced</div>
      ${kv('sampled at', ncTime(D.tm))}
      ${M.map((m, i) => kv(m.name, n(C.closed[i], 8) + '  vs  ' + n(C.numeric[i], 8))).join('')}
      ${kv('worst disagreement', fmtSig(C.gap, 4) + '  (' + fmtSig(C.rel, 4) + ' relative)')}
      ${kv('stepped with', C.steps + ' steps')}
      ${kv('order, by halving h', Number.isFinite(C.order) ? n(C.order, 4) + '  (error fell ' + n(C.ratio, 3) + '× for half the step)' : 'below what this chain can resolve')}
      ${kv('Σ N closed form', n(C.sumClosed, 12))}
      ${kv('Σ N stepped', n(C.sumNumeric, 12))}
      <p class="help">${gapOk
        ? 'The partial-fraction expansion and the stepped system agree, and they share no line of code — one is an antiderivative, the other a sum over ' + C.steps + ' intervals. The measured order near 2 is the linear interpolation of the source across each step, and it is measured by halving h rather than read off the derivation.'
        : 'The two routes have <b>not</b> converged on each other here. Either the chain is stiff enough that ' + C.steps + ' steps is too few, or the closed form has lost too many digits to cancellation — the card below says which.'}
      Both sums must be 1: the chain neither creates nor destroys nuclei, and that is a check on the arithmetic that costs nothing to run.</p>
    </div>
    <div class="card tight"><div class="ttl">What the closed form costs</div>
      ${kv('digits lost to cancellation', n(C.cancel.digits, 2) + ' of about 16')}
      ${kv('worst at', M[C.cancel.member] ? M[C.cancel.member].name : '—')}
      <p class="help">Bateman's sum alternates, and its terms carry 1/(λ<sub>i</sub> − λ<sub>j</sub>).
      Bring two half-lives close together and those terms grow without bound while their sum does not,
      so the subtraction discards digits. ${C.cancel.digits > 8
        ? 'Over eight digits are gone here — half the double-precision budget — which is exactly the situation in which "we have a closed form" stops being the reassuring statement it sounds like.'
        : 'At this spacing the loss is affordable, but it is <i>measured</i> rather than assumed, and pushing two half-lives within a percent of each other will show it climbing.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Where each daughter peaks</div>
      ${D.maxima.length ? D.maxima.map(m => kv(M[m.k].name,
          ncTime(m.t) + '  at N = ' + fmtSig(m.N, 5))).join('') +
        D.maxima.map(m => kv(M[m.k].name + ': two routes agree to',
          Number.isFinite(m.rel) ? fmtSig(m.rel, 3) + ' of the time itself' : 'no bracket — the peak is outside the window')).join('') +
        D.maxima.map(m => kv(M[m.k].name + ': activities there',
          fmtSig(m.actIn, 7) + '  vs  ' + fmtSig(m.actOut, 7))).join('')
        : kv('', 'no member of this chain has an interior maximum')}
      <p class="help">${D.maxima.length
        ? 'Each time above is found <b>twice</b>: once by maximising that member\'s population, which knows nothing about activities, and once by solving λ<sub>k−1</sub>N<sub>k−1</sub> = λ<sub>k</sub>N<sub>k</sub>, which knows nothing about maxima. They agree only because a daughter really is at its fullest when production and decay balance. The agreement stops at about 10⁻⁸ for a reason worth knowing: a maximum is flat, so its <i>position</i> can never be pinned better than the square root of machine precision, however good the arithmetic.'
        : 'A daughter bump needs production to beat decay for a while and then lose. This chain is arranged so that never happens — which is a result, not a gap.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The ratio the chain settles into</div>
      ${D.eq.ok
        ? kv('measured at', ncTime(D.eq.t)) +
          D.eq.rows.map(r => kv(M[r.k].name + ' ÷ ' + M[0].name,
            n(r.ratio, 8) + '   predicted ' + n(r.pred, 8))).join('') +
          kv('worst departure', fmtSig(D.eq.off, 3)) +
          kv('distance from secular', n(D.eq.secular, 6)) +
          kv('λ₁ ÷ slowest daughter', fmtSig(D.eq.mu, 4))
        : kv('no equilibrium', D.eq.why)}
      <p class="help">${D.eq.ok
        ? 'Late in a chain\'s life every activity ratio stops changing, and settles at ∏λ<sub>i</sub>/(λ<sub>i</sub> − λ<sub>1</sub>). ' + (D.eq.holds
            ? 'Here that product is within a percent of one, so every member of your chain has the <b>same activity</b> — secular equilibrium, and the reason radium is found in uranium ore at exactly the ratio of their decay constants.'
            : 'Here it is <b>not</b> one: ' + D.eq.why + '. The textbook statement that every member of a chain has equal activity is this product\'s limit, not a law, and your chain is far enough from that limit to see the difference.')
        : D.eq.why + '. Equilibrium needs the head to outlive everything below it — otherwise some daughter is still there long after its supply has stopped, and no ratio can be steady.'}</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.ncDecay.chainOf(st);
      if(!D.ok) return `<div class="k">your chain</div><div style="color:var(--c-neg)">cannot be read</div>`;
      return `<div class="k">your chain, ${D.P.members.length} members</div>
        <div>two routes agree to ${fmtSig(D.cmp.rel, 2)}</div>
        <div>${D.eq.ok && D.eq.holds ? 'secular equilibrium' : (D.eq.ok ? 'transient equilibrium' : 'no equilibrium')}</div>`;
    }
    return `<div class="k">${esc(NC_DECAYS[st.i].s)}</div><div>${fmtNum(100 * Math.pow(0.5, st.t), 1)}% remaining</div>`;
  }
};

/* ------------------------------------------------------------------------- */
/* Printing helpers for a typed barrier. Every one of these exists because the
   reader can write a potential for which the honest answer is not a number:
   a wall that never comes back down has no outer turning point and no
   half-life, and `Infinity` must never reach a readout. */
const ncBarNum = (v, d) => Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined here';
const ncBarExp = (v, d) => Number.isFinite(v) ? fmtSig(v, (d === undefined ? 3 : d) + 1) : 'not defined here';
/* a half-life given as its base-ten logarithm, because a typed barrier can put
   it past 10³⁰⁰ where the number itself no longer exists in double precision */
function ncBarHalf(L){
  if(!Number.isFinite(L)) return 'never — nothing gets out at all';
  if(L > 24)  return '10^(' + fmtNum(L, 4) + ') s — far beyond the age of the universe';
  if(L < -14) return '10^(' + fmtNum(L, 4) + ') s — shorter than a nuclear crossing time';
  return ncTime(Math.pow(10, L));
}

/* The barrier picture. The two ends of the shaded region are the ones the
   engine LOCATED by bisection, not ones this function solved for — which is the
   whole difference between this stage and the Coulomb one beside it. */
function ncDrawBarrier(ctx, st, O, Vf, x, y, w, h){
  const B = O.mine.B, R = O.R;
  const outer = (B.ok && Number.isFinite(B.b) && B.b > R) ? B.b : R * 5;
  const xm = Math.max(R * 1.5, Math.min(4000, outer * 1.45));
  const pts = [];
  let vmax = st.E;
  for(let i = 0; i <= 400; i++){
    const r = xm * i / 400;
    const v = r < R ? -st.well : Vf(Math.max(R, r));
    if(r >= R && Number.isFinite(v)) vmax = Math.max(vmax, v);
    pts.push({ x:r, y:v });
  }
  const yhi = Math.min(600, Math.max(st.E * 1.7, vmax * 1.18, 2));
  const ylo = -st.well - 8;
  const P = mkPlot(x, y, w, h, 0, xm, ylo, yhi);
  plotFrame(ctx, P, 'separation r (fm)', 'potential energy (MeV)',
            'the barrier you wrote, and where it stands above E');
  ctGrid(ctx, P);
  /* the forbidden region first, so the curve draws over its edge */
  if(B.ok && Number.isFinite(B.a) && Number.isFinite(B.b) && B.b > B.a){
    ctx.save();
    ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    ctx.beginPath();
    ctx.moveTo(P.X(B.a), P.Y(st.E));
    for(let i = 0; i <= 160; i++){
      const r = B.a + (B.b - B.a) * i / 160;
      const v = Vf(r);
      ctx.lineTo(P.X(r), P.Y(Math.min(yhi, Number.isFinite(v) ? v : st.E)));
    }
    ctx.lineTo(P.X(B.b), P.Y(st.E)); ctx.closePath();
    ctx.fillStyle = rgbCss(TH.neg, 0.28); ctx.fill();
    ctx.restore();
  }
  ctPath(ctx, P, pts.map(p => ({ x:p.x, y:Number.isFinite(p.y) ? Math.max(ylo, Math.min(yhi, p.y)) : NaN })),
         rgbCss(TH.text), 2.6);
  ctPath(ctx, P, [{ x:0, y:st.E }, { x:xm, y:st.E }], rgbCss(TH.warn), 2.1, [7, 5]);
  ctText(ctx, P.px + P.pw - 8, P.Y(st.E) - 8, 'E = ' + fmtNum(st.E, 2) + ' MeV',
         rgbCss(TH.warn), '12px ' + FONT_UI, 'right');
  ctPath(ctx, P, [{ x:R, y:ylo }, { x:R, y:yhi }], rgbCss(TH.grad, 0.55), 1.5, [4, 4]);
  ctText(ctx, P.X(R) + 5, P.py + P.ph - 8, 'R', rgbCss(TH.grad), '11px ' + FONT_UI);
  if(B.ok && Number.isFinite(B.a) && Number.isFinite(B.b) && B.b > B.a){
    for(const [r, lab] of [[B.a, 'a'], [B.b, 'b']]){
      ctPath(ctx, P, [{ x:r, y:ylo }, { x:r, y:st.E }], rgbCss(TH.curl, 0.7), 1.4, [3, 3]);
      ctDot(ctx, P, r, st.E, 4.5, rgbCss(TH.curl), rgbCss(TH.bg));
      ctText(ctx, P.X(r) + 5, P.Y(st.E) + 16, lab + ' = ' + fmtNum(r, 3) + ' fm',
             rgbCss(TH.curl), '11px ' + FONT_UI);
    }
  } else {
    ctText(ctx, P.px + P.pw / 2, P.py + 22,
           B.ok ? 'nothing here stands above E — no tunnelling needed'
                : 'no outer turning point — this wall never comes back down',
           rgbCss(TH.neg), '600 12px ' + FONT_UI, 'center');
  }
  return P;
}

/* Geiger–Nuttall, drawn as the measurement it is: nine measured half-lives, the
   nine YOUR barrier predicts, and a least-squares line through each. Two lines
   with the same slope and different intercepts is a different failure from two
   with different slopes, and the picture is the only place that reads at a
   glance. */
function ncDrawGN(ctx, S, x, y, w, h){
  const xs = NC_ALPHA_EMITTERS.map(e => e.dZ / Math.sqrt(e.Q));
  const ym = NC_ALPHA_EMITTERS.map(e => Math.log10(e.half));
  const x0 = Math.min.apply(null, xs) - 1.6, x1 = Math.max.apply(null, xs) + 1.6;
  let lo = Math.min.apply(null, ym), hi = Math.max.apply(null, ym);
  for(const r of S.rows){
    if(!Number.isFinite(r.pred)) continue;
    lo = Math.min(lo, r.pred); hi = Math.max(hi, r.pred);
  }
  lo = Math.max(-90, lo); hi = Math.min(200, hi);
  if(!(hi > lo)){ hi = lo + 1; }
  const pad = Math.max(1.5, (hi - lo) * 0.09);
  const P = mkPlot(x, y, w, h, x0, x1, lo - pad, hi + pad);
  plotFrame(ctx, P, 'Z ÷ √Q', 'log₁₀ of the half-life in seconds',
            'the law, fitted to your barrier and to the measurements');
  ctGrid(ctx, P);
  const line = (F, col, dash) => {
    if(!F || !F.ok) return;
    ctPath(ctx, P, [{ x:x0, y:F.predict ? F.predict(x0) : F.inter + F.slope * x0 },
                    { x:x1, y:F.inter + F.slope * x1 }], col, 1.8, dash);
  };
  line({ ok:S.fitMeas.ok, slope:S.fitMeas.slope, inter:S.fitMeas.inter }, rgbCss(TH.grad, 0.85), [7, 4]);
  line({ ok:S.fitPred.ok, slope:S.fitPred.slope, inter:S.fitPred.inter }, rgbCss(TH.curl, 0.85), null);
  /* the residual, drawn as the gap it is */
  for(const r of S.rows){
    if(!Number.isFinite(r.pred)) continue;
    ctPath(ctx, P, [{ x:r.x, y:r.meas }, { x:r.x, y:r.pred }], rgbCss(TH.faint, 0.7), 1.1);
  }
  for(let i = 0; i < NC_ALPHA_EMITTERS.length; i++)
    ctDot(ctx, P, xs[i], ym[i], 4.6, rgbCss(TH.grad), rgbCss(TH.bg));
  for(const r of S.rows){
    if(!Number.isFinite(r.pred)) continue;
    ctDot(ctx, P, r.x, r.pred, 4.2, rgbCss(TH.curl), rgbCss(TH.bg));
  }
  const sl = F => F.ok ? fmtNum(F.slope, 4) : '—';
  ctText(ctx, P.px + 8, P.py + 16, 'your slope ' + sl(S.fitPred), rgbCss(TH.curl), '11px ' + FONT_UI);
  ctText(ctx, P.px + 8, P.py + 31, 'measured ' + sl(S.fitMeas), rgbCss(TH.grad), '11px ' + FONT_UI);
  ctText(ctx, P.px + 8, P.py + 46, 'leading order ' + fmtNum(S.lead, 4), rgbCss(TH.faint), '11px ' + FONT_UI);
  if(!S.rows.length)
    ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2,
           'your barrier lets none of the nine through', rgbCss(TH.neg), '600 12px ' + FONT_UI, 'center');
  return P;
}

STAGES.ncBarrier = {
  title:'The Coulomb barrier and why half-lives span 10²⁴',
  legend(st){
    if(st && st.own)
      return [['var(--text)', 'the barrier you wrote, V(r, Z)'],
              ['var(--c-warn)', 'the α energy E'],
              ['var(--c-neg)', 'the forbidden region — its ends located, not solved for'],
              ['var(--c-curl)', 'your barrier: turning points, and its nine predictions'],
              ['var(--c-grad)', 'the nuclear surface R, and the nine measured half-lives']];
    return [['var(--text)', 'the potential — flat well inside, Coulomb outside'],
            ['var(--c-warn)', 'the α energy E'],
            ['var(--c-neg)', 'the classically forbidden region'],
            ['var(--c-grad)', 'the nuclear surface R'],
            ['var(--c-curl)', 'where it exits, b']]; },
  dockLegend:true,
  enter(st, o){
    st.Z = o.Z || 90;
    st.A = o.A || 234;
    st.E = o.E || 4.3;
    st.own = !!o.own;
    st.well = o.well || NC_WELL;
    /* the bare Coulomb tail, written out. 2αħc = 2.8799291 MeV·fm, and typing it
       to eight figures is what limits the agreement with the closed form to
       about 10⁻⁸ — the quadrature itself is far better than that, and the
       calibration card computes the same comparison with the exact coefficient
       so the two effects can be told apart. */
    st.vsrc = o.vsrc || '2.8799291*Z/r';
  },
  /* the reader's V as a function of (r, Z), guarded: a half-typed formula must
     never take the stage down, and fnWire keeps the last one that parsed */
  vofOf(st){
    const g = pkCompile(ncBarrierSrc(st.vsrc), () => NaN);
    return Z => (r => g(r, Z, 0));
  },
  /* Nine emitters × (a 4000-point region scan + Gauss–Legendre at two panel
     counts) is roughly 90 000 evaluations of a compiled expression. `readout`
     runs four times a second and `frame` every animation frame, so this is
     keyed on everything that can change it and on nothing that cannot — the
     three sliders below move the drawn nucleus, not the score. */
  barrierOf(st){
    const key = st.vsrc + '|' + st.well;
    if(st._bk === key) return st._bd;
    st._bk = key;
    const Vof = STAGES.ncBarrier.vofOf(st);
    st._bd = { Vof, score:ncBarrierScore(Vof, st.well) };
    return st._bd;
  },
  oneOf(st){
    const key = st.vsrc + '|' + st.well + '|' + st.Z + '|' + st.A + '|' + st.E;
    if(st._ok === key) return st._od;
    st._ok = key;
    const Vof = STAGES.ncBarrier.barrierOf(st).Vof;
    const R = ncRadius(st.A) + ncRadius(4);
    st._od = {
      R,
      mine:ncBarrierHalfLife(Vof(st.Z), st.E, R, st.A, st.well),
      /* THE CALIBRATION. The same quadrature, run over the bare Coulomb tail —
         whose WKB integral ncGamow does as an antiderivative. Nothing the reader
         types changes either number, and they share no line of code. */
      calQ:ncBarrierG(ncCoulombVof(st.Z), st.E, R),
      calC:ncGamow(st.Z, st.E, st.A)
    };
    return st._od;
  },
  controlsOwn(){
    const st = ST;
    return fnHtml('cbV', 'V(r, Z) =', st.vsrc, 'r in fm and Z the daughter charge — the value is the potential energy in MeV, outside the nuclear surface') +
      ctlRow('daughter Z', ctlSlider('cbZ', 60, 100, 1, st.Z)) +
      ctlRow('daughter A', ctlSlider('cbA', 140, 250, 1, st.A)) +
      ctlRow('α energy', ctlSlider('cbE', 3.5, 9, 0.05, st.E)) +
      ctlRow('well depth', ctlSlider('cbW', 10, 60, 0.5, st.well)) +
      `<p class="help">The default is the bare Coulomb tail, 2Zαħc/r, with 2αħc written out to eight
      figures. Change it and everything downstream is recomputed: try
      <b>2.8799291·Z/r·exp(−r/120)</b> for a screened tail, or subtract a Gaussian pocket
      <b>− 25·exp(−(r−11)^2/9)</b> to thin the barrier near the surface.</p>
      <p class="help">Two things the Coulomb case never had to do are done here. The
      <b>turning points are found</b> — the potential is scanned outwards on a geometric grid and the
      ends of the region standing above E are bisected — where b = 2Zαħc/E was an inversion of one
      formula and nothing else. And the <b>integral is done</b>: κ = √(2m(V−E))/ħc vanishes like a
      square root at a turning point, so each end is straightened by r = b − u² before Gauss–Legendre
      sees it, and the routine reports its own error by running at two panel counts and differencing.</p>
      <p class="help">The payoff is the <b>Geiger–Nuttall law as a measurement</b>. Your barrier is run
      over nine real α emitters spanning twenty-four orders of magnitude in half-life, log₁₀T½ is
      fitted against Z/√Q by least squares, and your slope is set beside the slope the measurements
      actually have and beside the analytic leading-order coefficient 2πα√(2m_α)/ln10. Sweep the well
      depth once: it moves the intercept by whole orders of magnitude and the slope by less than a
      part in a thousand, because it enters the attempt rate and never the barrier.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('cbM', st.own ? 'own' : 'coul',
                      [['coul', 'the Coulomb tail'], ['own', 'shape your own barrier']]);
    if(st.own) return seg + STAGES.ncBarrier.controlsOwn();
    return seg + ctlRow('daughter Z', ctlSlider('cbZ', 60, 100, 1, st.Z)) +
      ctlRow('daughter A', ctlSlider('cbA', 140, 250, 1, st.A)) +
      ctlRow('α energy', ctlSlider('cbE', 3.5, 9, 0.05, st.E)) +
      `<p class="help">The α particle inside a heavy nucleus is trapped behind a Coulomb barrier
      several times taller than its own energy. Classically it can never leave, and the half-life
      would be infinite. It leaves by tunnelling — and the tunnelling probability is exponential in
      the barrier's area, which is what turns a factor of two in energy into a factor of 10²⁴ in
      lifetime.</p>
      <p class="help">Nudge the energy slider by half an MeV and watch the exponent move. That
      extreme sensitivity is the Geiger–Nuttall law, and it is why α emitters are either
      essentially stable or essentially instantaneous, with very little in between.</p>`;
  },
  wire(){
    ctWireSeg('cbM', v => { ST.own = (v === 'own'); });
    wireSlider('cbZ', () => ST.Z, v => { ST.Z = Math.round(v); }, v => String(Math.round(+v)));
    wireSlider('cbA', () => ST.A, v => { ST.A = Math.round(v); }, v => String(Math.round(+v)));
    wireSlider('cbE', () => ST.E, v => { ST.E = v; }, v => fmtNum(+v, 2) + ' MeV');
    if(!ST.own) return;
    wireSlider('cbW', () => ST.well, v => { ST.well = v; }, v => fmtNum(+v, 1) + ' MeV');
    /* the build is passed explicitly so the two physics names are rewritten
       before the parser sees them — and so that a formula which does not parse
       THROWS, which is what leaves the previous barrier on the screen */
    fnWire('cbV', (m, s) => { ST.vsrc = s; },
           s => { const g = compile(parse(ncBarrierSrc(s))); return { f:(r, Z) => g(r, Z, 0) }; });
  },
  /* Two pictures: the barrier, and the law fitted to it. Side by side when
     there is width for both, stacked when there is height instead, and the
     barrier alone when there is neither — `auditsize` sweeps eight canvas
     shapes and all three arms are reached. */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.ncBarrier.barrierOf(st);
    const O = STAGES.ncBarrier.oneOf(st);
    const Vf = D.Vof(st.Z);
    /* the readout chip floats over the top-left ~180×90 px, and the left plot's
       title is centred over exactly that corner — so this view starts lower
       than the preset one, which has no plot there to hide */
    const px = 78, top = 84;
    const aw = Math.max(60, W - px - 96), ah = Math.max(60, H - top - 92);
    if(W >= 800 && aw >= 460){
      const half = (aw - 66) / 2;
      st.P = ncDrawBarrier(ctx, st, O, Vf, px, top, half, ah);
      ncDrawGN(ctx, D.score, px + half + 66, top, half, ah);
    } else if(ah >= 340){
      const half = (ah - 54) / 2;
      st.P = ncDrawBarrier(ctx, st, O, Vf, px, top, aw, half);
      ncDrawGN(ctx, D.score, px, top + half + 54, aw, half);
    } else {
      st.P = ncDrawBarrier(ctx, st, O, Vf, px, top, aw, ah);
    }
    stageNote(ctx, 'the ends of the shaded region were located by bisection, and its area integrated — ' +
                   'nothing here was solved in closed form', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.ncBarrier.frameOwn(st, dt, ctx, W, H);
    const G = ncGamow(st.Z, st.E, st.A);
    const R = G.R, b = G.b;
    const xm = Math.max(80, b * 1.35);
    const P = mkPlot(80, 55, W - 170, H - 145, 0, xm, -35, 40);
    st.P = P;
    plotFrame(ctx, P, 'separation r (fm)', 'potential energy (MeV)',
              'the barrier the α must get through, and the energy it has to do it with');
    ctGrid(ctx, P);

    /* the potential: a flat well inside R, Coulomb outside */
    const V = r => (r < R ? -30 : ncCoulombBarrier(2, st.Z, r));
    const pts = [];
    for(let i = 0; i <= 500; i++){
      const r = xm * i / 500;
      pts.push({ x:r, y:Math.max(-35, Math.min(40, V(Math.max(0.5, r)))) });
    }
    ctPath(ctx, P, pts, rgbCss(TH.text), 2.8);

    /* the α's energy level, and the classically forbidden region it crosses */
    ctPath(ctx, P, [{ x:0, y:st.E }, { x:xm, y:st.E }], rgbCss(TH.warn), 2.2, [7, 5]);
    ctText(ctx, P.X(xm) - 110, P.Y(st.E) - 10, 'E = ' + fmtNum(st.E, 2) + ' MeV', rgbCss(TH.warn), '12px ' + FONT_UI);

    /* shade the tunnelling region — this area IS the exponent */
    if(b > R){
      ctx.beginPath();
      ctx.moveTo(P.X(R), P.Y(st.E));
      for(let i = 0; i <= 200; i++){
        const r = R + (b - R) * i / 200;
        ctx.lineTo(P.X(r), P.Y(Math.min(40, ncCoulombBarrier(2, st.Z, r))));
      }
      ctx.lineTo(P.X(b), P.Y(st.E)); ctx.closePath();
      ctx.fillStyle = rgbCss(TH.neg, 0.28); ctx.fill();
      ctText(ctx, P.X(R) + 10, P.Y(st.E) - 26, 'classically forbidden', rgbCss(TH.neg), '12px ' + FONT_UI);
    }
    ctPath(ctx, P, [{ x:R, y:-35 }, { x:R, y:40 }], rgbCss(TH.grad, 0.6), 1.6, [4, 4]);
    ctText(ctx, P.X(R) + 6, P.Y(-28), 'nuclear surface', rgbCss(TH.grad), '11px ' + FONT_UI);
    if(b < xm){
      ctPath(ctx, P, [{ x:b, y:-35 }, { x:b, y:40 }], rgbCss(TH.curl, 0.6), 1.6, [4, 4]);
      ctText(ctx, P.X(b) + 6, P.Y(-28), 'exits here', rgbCss(TH.curl), '11px ' + FONT_UI);
    }
    stageNote(ctx, 'the shaded area is what sets the exponent — halve it and the half-life drops by many powers of ten', W, H);
  },
  deriveOwn(st){
    const D = STAGES.ncBarrier.barrierOf(st), O = STAGES.ncBarrier.oneOf(st);
    const B = O.mine.B, S = D.score;
    const n = v => ncBarNum(v, 5);
    return {
      title:'A barrier with no closed form, and the law measured from it',
      steps:[
        drvStep('the potential, as you wrote it',
          `${dv('V')}(${dv('r')}, ${dv('Z')}) ${dop('=')} ${pkPretty(st.vsrc)}`,
          `evaluated at Z = ${st.Z}, and again at each of nine other charges below`),
        drvSay('what stops being available the moment the potential is arbitrary',
          'For the bare Coulomb tail the outer turning point is b = 2Zαħc/E — an inversion of one formula — and the WKB integral has an antiderivative in arccos√x. Neither survives a general V. Both have to be replaced by something that works for any potential at all, and the replacements are what the rest of this ladder is.'),
        drvStep('the forbidden region, located rather than solved for',
          `${dv('V')}(${dv('r')}) ${dop('−')} ${dv('E')} ${dop('=')} 0 , &nbsp; bisected`,
          B.ok && Number.isFinite(B.a)
            ? `a = ${n(B.a)} fm, b = ${n(B.b)} fm, so ${n(B.b - B.a)} fm of forbidden ground`
            : (B.note || 'no forbidden region was found here')),
        drvSay('why the scan is geometric and not uniform',
          'The interesting structure of a nuclear potential is at a few femtometres and the turning point can be at several hundred. A uniform grid spends nearly all of its resolution where nothing is happening and still misses a narrow feature near the surface; a geometric one gives every decade the same number of samples. Each crossing it brackets is then bisected, so the accuracy of the turning points is not limited by the grid that found them.'),
        drvStep('the integrand, and the singularity at each end',
          `κ(${dv('r')}) ${dop('=')} ${dfrac('√(2' + dv('m') + '(' + dv('V') + '−' + dv('E') + '))', 'ħ' + dv('c'))} ~ √(${dv('b')} ${dop('−')} ${dv('r')}) &nbsp; as ${dv('r')} ${dop('→')} ${dv('b')}`,
          'a square-root zero, which no polynomial rule integrates better than order 1½'),
        drvStep('so each end is straightened before it is integrated',
          `${dv('r')} ${dop('=')} ${dv('b')} ${dop('−')} ${dv('u')}² , &nbsp; d${dv('r')} ${dop('=')} ${dop('−')}2${dv('u')} d${dv('u')}`,
          'the √ cancels against the Jacobian and the integrand becomes smooth'),
        drvSay('and only then is a high-order rule worth using',
          'Gauss–Legendre converges at a rate set by how many derivatives the integrand has. On √(b−r) it has none at the endpoint and the rule does no better than a trapezoid; on the substituted integrand it is limited by nothing and reaches machine precision on a few hundred panels. The routine does not take that on trust — it runs at two panel counts and differences them, and the number below is what it found.'),
        drvStep('the integral, with the error it admits to',
          `${dv('G')} ${dop('=')} ∫ κ(${dv('r')}) d${dv('r')}`,
          B.ok ? `G = ${n(B.G)}, quadrature error ${ncBarExp(B.err, 2)}` : 'not defined for this barrier'),
        drvStep('the calibration — the same quadrature on a case with an antiderivative',
          `${dv('G')}_quad ${dop('−')} ${dv('G')}_closed &nbsp; on &nbsp; ${dv('V')} ${dop('=')} 2${dv('Z')}αħ${dv('c')}/${dv('r')}`,
          `${ncBarExp(Math.abs(O.calQ.G - O.calC.G), 3)} — and nothing you type changes it`),
        drvStep('the half-life, entirely in the log domain',
          `log₁₀${dv('T')}½ ${dop('=')} log₁₀${dfrac('ln 2', dv('f'))} ${dop('+')} ${dfrac('2' + dv('G'), 'ln 10')}`,
          `f = ${ncBarExp(O.mine.F.f, 3)} per second from a well ${fmtNum(st.well, 1)} MeV deep; T½ = ${ncBarHalf(O.mine.log10Half)}`),
        drvSay('the exponential is why none of this is done as a number',
          'A real α barrier gives e^(−2G) with G near 40, and a barrier you can easily type puts it past 400 — where the exponential underflows to zero and every ratio downstream becomes 0/0. Keeping log₁₀T throughout costs nothing and means an unreasonable barrier gives an unreasonable answer rather than no answer.'),
        drvStep('and the law, fitted to your barrier rather than quoted',
          `log₁₀${dv('T')}½ ${dop('=')} ${dv('c')}${dop('·')}${dfrac(dv('Z'), '√' + dv('Q'))} ${dop('+')} ${dv('d')}`,
          S.fitPred.ok
            ? `your slope ${n(S.fitPred.slope)}, the measurements' ${n(S.fitMeas.slope)}, leading order ${n(S.lead)}`
            : 'no emitter got through this barrier, so there is no line to fit'),
        drvSay('why the leading-order coefficient is not a fitted parameter',
          'Expand the Coulomb barrier integral in R/b and the first term is G ≈ πZα√(2m/E), which turns the law into log₁₀T½ = 2πα√(2m_α)/ln10 · Z/√Q + constant. That coefficient is built from the fine-structure constant and the α mass and nothing else. It is printed beside your fitted slope and beside the slope the nine measured half-lives actually have, so a barrier that gets the slope right while missing the intercept can be told apart from one that gets neither.')
      ],
      note:'The well depth is the one genuinely free parameter in the whole calculation, and it enters only through the assault frequency — so it moves the intercept by orders of magnitude and the slope by less than a part in a thousand. Not by nothing at all: the attempt rate depends on E + V₀, so it varies a little across the nine Q values and tilts the line by a hair. Sweeping the depth once is the cleanest way to see which half of the Geiger–Nuttall law is barrier physics and which half is bookkeeping about how often the α arrives at the wall.'
    };
  },
  derive(st){
    if(st.own) return STAGES.ncBarrier.deriveOwn(st);
    const G = ncGamow(st.Z, st.E, st.A);
    const n = v => fmtNum(v, 5);
    const Vtop = ncCoulombBarrier(2, st.Z, G.R);
    const H0 = ncGamowHalfLife(st.Z, st.E, st.A);
    return {
      title:'Why a small change in energy is an enormous change in lifetime',
      steps:[
        drvStep('the barrier height at the nuclear surface',
          `${dv('V')} ${dop('=')} ${dfrac('2' + dv('Z') + dop('e') + '²', '4πε₀' + dv('r'))} ${dop('=')} 2${dv('Z')}α${dfrac('ħ' + dv('c'), dv('r'))}`,
          `at r = ${n(G.R)} fm: ${n(Vtop)} MeV, against an α with only ${st.E} MeV`),
        drvSay('classically, that is the end of the story',
          'The α has less energy than the barrier is tall. A classical particle turns around and stays inside forever — the half-life would be infinite, and no heavy element would ever decay. Every α emitter that exists is direct evidence that this reasoning is wrong.'),
        drvStep('quantum mechanically the wavefunction leaks through',
          `${dv('T')} ${dop('≈')} ${dop('e')}^(−2${dv('G')}) , &nbsp; ${dv('G')} ${dop('=')} ${dfrac('1', 'ħ')}∫ √(2${dv('m')}(${dv('V')}−${dv('E')})) d${dv('r')}`,
          'the WKB approximation — the same integral the quantum wing computes for a square barrier'),
        drvStep('the outer turning point is where the barrier drops to E',
          `${dv('b')} ${dop('=')} ${dfrac('2' + dv('Z') + 'αħ' + dv('c'), dv('E'))}`,
          `b = ${n(G.b)} fm, so the α must cross ${n(G.b - G.R)} fm of forbidden ground`),
        drvStep('the integral has a closed form',
          `${dv('G')} ${dop('=')} ${dfrac('√(2' + dv('m') + dv('E') + ')', 'ħ' + dv('c'))}·${dv('b')}·[arccos√${dv('x')} ${dop('−')} √(${dv('x')}(1−${dv('x')}))] , &nbsp; ${dv('x')} ${dop('=')} ${dv('R')}/${dv('b')}`,
          `G = ${n(G.G)}`),
        drvStep('and the transmission probability is its exponential',
          `${dv('T')} ${dop('=')} ${dop('e')}^(−2${dv('G')})`,
          `T = ${G.T < 1e-4 ? fmtSig(G.T, 4) : n(G.T)}`),
        drvSay('where the twenty-four orders of magnitude come from',
          'G sits in an exponent and depends on energy roughly as 1/√E. Change E from 4 to 9 MeV — a factor of about two — and G falls by a factor of a few; but because it is exponentiated, T rises by twenty-odd powers of ten. That is the Geiger–Nuttall law: plot log T½ against 1/√E for any α emitter and the points fall on a straight line, across a range of lifetimes running from microseconds to longer than the age of the universe.'),
        drvStep('the half-life follows from how often it tries',
          `${dv('T')}½ ${dop('≈')} ${dfrac('ln 2', dv('f'))}${dop('·')}${dfrac('1', dv('T'))}`,
          `f = v/2R = ${fmtSig(H0.F.f, 4)} per second — computed from the well, not assumed; times T gives ${ncTime(H0.half)}`),         drvSay('and the estimate has to answer to measurement',           'The readout scores this against nine real α emitters whose measured half-lives span twenty-four orders of magnitude. The model tracks them to within a couple of orders throughout: it gets the slope essentially right and the absolute normalisation only roughly, because it assumes a spherical parent, no angular momentum carried off, and a WKB barrier. That is what should be claimed for it, and no more.')
      ],
      note:'This was Gamow\'s 1928 calculation, and it was the first application of quantum mechanics to the nucleus. It explained a correlation that had been a complete mystery for twenty years — and it did it with a barrier, an exponential, and no adjustable parameters.'
    };
  },
  readoutOwn(st){
    const D = STAGES.ncBarrier.barrierOf(st), O = STAGES.ncBarrier.oneOf(st);
    const B = O.mine.B, S = D.score;
    const n = (v, d) => ncBarNum(v, d);
    const calGap = Math.abs(O.calQ.G - O.calC.G);
    const dG = (B.ok && O.calC.G > 0) ? B.G - O.calC.G : NaN;
    const vR = D.Vof(st.Z)(O.R);
    return `<div class="card tight"><div class="ttl">Your barrier, at Z = ${st.Z}</div>
      ${kv('V(r, Z)', pkPretty(st.vsrc) + '  MeV')}
      ${kv('nuclear surface R', n(O.R) + ' fm')}
      ${kv('V at the surface', Number.isFinite(vR) ? n(vR) + ' MeV' : 'your formula gives no value there')}
      ${kv('α energy E', fmtNum(st.E, 3) + ' MeV')}
      ${kv('inner turning point a', B.ok ? n(B.a, 6) + ' fm' : '—')}
      ${kv('outer turning point b', B.ok ? n(B.b, 6) + ' fm' : '—')}
      ${kv('forbidden width', B.ok && Number.isFinite(B.width) ? n(B.width, 6) + ' fm' : '—')}
      ${kv('separate forbidden regions', String(B.regions))}
      ${B.note ? kv('', B.note) : ''}
      <p class="help">${B.extra > 0
        ? 'Your potential stands above E in <b>' + B.regions + ' separate places</b>. Only the first is integrated, because that is the barrier the α meets on its way out — but a double-humped barrier is a different physical problem, with resonances between the humps that WKB does not describe, and you should know you have written one.'
        : (B.turn === false
           ? 'The inner end of the forbidden region is the <b>wall of the well</b>, not a turning point: V jumps above E there rather than rising through it. That end needs no straightening, and the quadrature is told so.'
           : 'Both ends are genuine turning points, where V crosses E. κ vanishes like a square root at each, which is why each end is substituted before it is integrated.')}</p>
    </div>
    <div class="card tight"><div class="ttl">The integral, and the error it admits to</div>
      ${kv('G = ∫κ dr', B.ok ? n(B.G, 8) : 'not defined for this barrier')}
      ${kv('quadrature error, by halving the panel width', B.ok ? ncBarExp(B.err, 3) : '—')}
      ${kv('log₁₀ of the transmission', B.ok ? n(B.log10T, 6) : '—')}
      ${kv('attempts per second', ncBarExp(O.mine.F.f, 4))}
      ${kv('half-life', ncBarHalf(O.mine.log10Half))}
      <p class="help">The error above is <b>measured</b>: the integral is run at two panel counts and
      differenced. Everything is carried as log₁₀T rather than as T, because a barrier you can type
      in a second puts e^(−2G) below 10⁻³⁰⁰, where the number stops existing and every ratio built
      from it becomes 0/0.</p>
    </div>
    <div class="card tight"><div class="ttl">The quadrature, calibrated against a closed form</div>
      ${kv('G over the bare Coulomb tail, by quadrature', n(O.calQ.G, 10))}
      ${kv('the same integral, as an antiderivative', n(O.calC.G, 10))}
      ${kv('they differ by', fmtAgree(O.calQ.G, O.calC.G))}
      ${kv('your barrier, against that tail', Number.isFinite(dG)
          ? (dG > 0 ? '+' : '') + n(dG, 6) + ' in G'
          : 'no comparison — your barrier has no turning point here')}
      ${kv('which is a factor of', Number.isFinite(dG)
          ? '10^(' + fmtNum(2 * dG / Math.LN10, 3) + ') in half-life' : '—')}
      <p class="help">The first two rows are the only numbers on this page that <b>nothing you type can
      change</b>. One is a sum over sample points, the other an antiderivative in arccos√x, and they
      share no line of code; their agreement is what makes the rest of the panel worth reading. The
      rows below it are your barrier measured against that same tail — which is the effect of your
      edit, stated as the factor in half-life it is worth.</p>
    </div>
    <div class="card tight"><div class="ttl">Geiger–Nuttall, fitted to your barrier</div>
      ${S.rows.length
        ? S.rows.map(r => kv(esc(r.e.s) + '  Q = ' + fmtNum(r.e.Q, 3),
            n(r.pred, 4) + '  vs  ' + n(r.meas, 4) + '   (' + (r.dex > 0 ? '+' : '') + fmtNum(r.dex, 2) + ' dex)')).join('') +
          kv('your fitted slope', S.fitPred.ok ? n(S.fitPred.slope, 6) : '—') +
          kv('the measurements\' slope', S.fitMeas.ok ? n(S.fitMeas.slope, 6) : '—') +
          kv('leading order, 2πα√(2m_α)/ln10', n(S.lead, 6)) +
          kv('yours ÷ measured', Number.isFinite(S.slopeRatio) ? fmtNum(S.slopeRatio, 5) + '×' : '—') +
          kv('r² of your fit', S.fitPred.ok ? n(S.fitPred.r2, 5) : '—') +
          kv('mean |error| against measurement', Number.isFinite(S.meanDex) ? fmtNum(S.meanDex, 3) + ' orders of magnitude' : '—') +
          (S.worst ? kv('worst', esc(S.worst.e.s) + ', ' + fmtNum(S.worst.dex, 2) + ' dex') : '') +
          (S.dropped.length ? kv('emitters your barrier stops entirely', String(S.dropped.length)) : '')
        : kv('', 'not one of the nine gets through this barrier — there is nothing to fit')}
      <p class="help">${S.rows.length
        ? 'Each row is your barrier run at that emitter\'s daughter charge and Q value. The measured half-lives span <b>twenty-four orders of magnitude</b> across a factor of 2.2 in energy, so the <i>slope</i> is the demanding part and the intercept is not: the line above is fitted to your nine predictions, and the two numbers under it are the slope the measurements themselves have and the slope that falls out of the barrier integral analytically, with no adjustable anything. A barrier that gets the slope right and the intercept wrong is a statement about how often the α tries; one that gets the slope wrong is a statement about the barrier.'
        : 'A wall that never comes back down below E has no outer turning point, so nothing escapes and no half-life exists. That is a result rather than an error, and it is why the whole calculation is carried in the log domain — the alternative is nine copies of 0/0.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Where the intercept comes from</div>
      ${kv('well depth', fmtNum(st.well, 2) + ' MeV')}
      ${kv('kinetic energy inside', n(O.mine.F.K, 5) + ' MeV')}
      ${kv('speed inside', n(O.mine.F.v / 1e7, 4) + ' × 10⁷ m/s')}
      ${kv('attempts per second', ncBarExp(O.mine.F.f, 4))}
      <p class="help">The assault frequency is <b>computed</b>, not quoted: inside the well the α has
      kinetic energy E plus the depth, which gives it a speed, and it crosses the nucleus and returns
      in 2R/v. Move the depth slider and watch the Geiger–Nuttall <b>intercept</b> shift by whole
      orders of magnitude while the slope moves by less than a part in a thousand — the slope is
      barrier physics, and the depth never enters the barrier.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.ncBarrier.readoutOwn(st);
    const G = ncGamow(st.Z, st.E, st.A);
    const n = v => fmtNum(v, 5);
    const Vtop = ncCoulombBarrier(2, st.Z, G.R);
    const H = ncGamowHalfLife(st.Z, st.E, st.A);
    const half = H.half;
    /* the same nucleus at an energy 1 MeV higher, for the comparison */
    const H2 = ncGamowHalfLife(st.Z, st.E + 1, st.A);
    const half2 = H2.half;
    /* score the model against every measured emitter, so the estimate has to
       answer to nature rather than only to itself */
    const scored = NC_ALPHA_EMITTERS.map(e => {
      const p = ncGamowHalfLife(e.dZ, e.Q, e.dA).half;
      return { e, p, dex: (isFinite(p) && p > 0) ? Math.log10(p / e.half) : NaN };
    });
    const worst = scored.reduce((a, b) =>
      (Math.abs(b.dex) > Math.abs(a.dex) || isNaN(a.dex)) ? b : a, scored[0]);
    const meanAbs = scored.filter(s => isFinite(s.dex))
                          .reduce((a, s) => a + Math.abs(s.dex), 0) /
                    Math.max(1, scored.filter(s => isFinite(s.dex)).length);
    return `<div class="card tight"><div class="ttl">The barrier</div>
      ${kv('nuclear radius R', n(G.R) + ' fm')}
      ${kv('barrier height at R', n(Vtop) + ' MeV')}
      ${kv('α energy', st.E + ' MeV')}
      ${kv('height ÷ energy', fmtNum(Vtop / st.E, 3) + '×')}
      ${kv('exit radius b', n(G.b) + ' fm')}
      ${kv('forbidden width', n(Math.max(0, G.b - G.R)) + ' fm')}
      <p class="help">The α is trying to get out of a hole several times deeper than it can climb,
      across a gap wider than the nucleus itself. Everything about α decay follows from the fact
      that it nonetheless sometimes succeeds.</p>
    </div>
    <div class="card tight"><div class="ttl">Tunnelling</div>
      ${kv('Gamow factor G', n(G.G))}
      ${kv('transmission per attempt', G.T < 1e-4 ? fmtSig(G.T, 5) : n(G.T))}
      ${kv('speed inside the well', n(H.F.v / 1e7) + ' × 10⁷ m/s')}
      ${kv('attempts per second', fmtSig(H.F.f, 5))}
      ${kv('estimated half-life', half > 1e30 ? 'far longer than the universe' : ncTime(half))}
      <p class="help">The assault frequency is <b>computed, not quoted</b>: inside the well the α has
      kinetic energy Q + ${NC_WELL} MeV, which gives it a speed, and it crosses the nucleus and
      returns in 2R/v. That comes out near 10²¹ per second — the number textbooks state as a given.</p>
    </div>
    <div class="card tight"><div class="ttl">Scored against nine measured emitters</div>
      ${scored.map(s => kv(esc(s.e.s) + '  Q = ' + fmtNum(s.e.Q, 3),
          isFinite(s.dex) ? (s.dex > 0 ? '+' : '') + fmtNum(s.dex, 2) + ' dex' : '—')).join('')}
      ${kv('mean |error|', fmtNum(meanAbs, 2) + ' orders of magnitude')}
      ${kv('worst case', esc(worst.e.s) + ', ' + fmtNum(worst.dex, 2) + ' dex')}
      <p class="help">Each row is log₁₀(predicted ÷ measured). The measured half-lives span
      <b>24 orders of magnitude</b> across a factor of 2.2 in energy, and this one-parameter model
      tracks them to within a couple of orders throughout. That residual is real: the model assumes a
      spherical parent, no angular momentum carried off by the α, and a WKB barrier. It gets the
      <i>slope</i> — the Geiger–Nuttall law — essentially right, and the absolute normalisation only
      roughly, which is exactly what should be claimed for it.</p>
    </div>
    <div class="card tight"><div class="ttl">One more MeV</div>
      ${kv('at ' + fmtNum(st.E + 1, 2) + ' MeV, G', n(H2.G.G))}
      ${kv('half-life becomes', half2 > 1e30 ? 'still enormous' : ncTime(half2))}
      ${kv('lifetime ratio', half2 > 0 && isFinite(half / half2) ? fmtNum(half / half2, 4) + '×' : 'astronomically large')}
      <p class="help">One extra MeV — about a quarter more energy — and the half-life collapses by
      many orders of magnitude. Nothing in classical physics responds to its inputs like this. It is
      the signature of a quantity sitting inside an exponent.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.ncBarrier.barrierOf(st), O = STAGES.ncBarrier.oneOf(st);
      const S = D.score, B = O.mine.B;
      return `<div class="k">your barrier</div>
        <div>G = ${B.ok ? fmtNum(B.G, 3) : 'no way out'}</div>
        <div>slope ${S.fitPred.ok ? fmtNum(S.fitPred.slope, 3) : '—'} vs ${S.fitMeas.ok ? fmtNum(S.fitMeas.slope, 3) : '—'} measured</div>`;
    }
    const G = ncGamow(st.Z, st.E, st.A);
    return `<div class="k">barrier ${fmtNum(ncCoulombBarrier(2, st.Z, G.R), 1)} MeV</div><div>E = ${st.E} MeV, G = ${fmtNum(G.G, 2)}</div>`;
  }
};
