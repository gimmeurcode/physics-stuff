/* ============================================================================
   
2ga - THE ATOM: WEAK DECAY AND THE BINDING CURVE
   Split out of 
60c-stages-atom.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */


/* ---- 10 · beta decay: the weak force at work ----------------------------------- */
STAGES.atomBeta = {
  title: 'β decay & the weak force',
  derive(st){
    if(st.own) return STAGES.atomBeta.deriveOwn(st);
    return {
      title:'A continuous spectrum, and the particle it forced into existence',
      steps:[
        drvSay('the crisis of the 1920s',
          'In α and γ decay the emitted particle always carries the same energy, as a two-body decay must. In β decay the electron energy varies continuously from zero up to a maximum. Energy appeared not to be conserved, and Bohr was prepared to abandon conservation to explain it.'),
        drvStep('a two-body decay gives a single energy',
          `${dv('E')} fixed by conservation of energy and momentum`,
          'two equations, two unknowns — the outcome is determined'),
        drvStep('but the measured spectrum is continuous',
          `0 ${dop('≤')} ${dv('E')}_e ${dop('≤')} ${dv('Q')}`,
          `Q = ${fmtNum(BETA_Q, 4)} MeV — the panel accumulates real simulated decays into a histogram`),
        drvSay('Pauli\'s solution, offered apologetically',
          'In 1930 he proposed an undetected neutral particle sharing the energy, calling it a "desperate remedy" and doubting it could ever be found. Three bodies mean the energy can be divided any number of ways, so the electron spectrum becomes continuous — exactly as observed.'),
        drvStep('the actual process, at the quark level',
          `${dv('d')} ${dop('→')} ${dv('u')} ${dop('+')} ${dv('W')}^− ${dop('→')} ${dv('u')} ${dop('+')} ${dop('e')}^− ${dop('+')} ν̄`,
          'a down quark becomes an up quark, so a neutron becomes a proton'),
        drvSay('and the W boson is why the decay is slow',
          'The W is about 80 GeV while the energy available is under 1 MeV, so it exists only as a virtual particle far off its mass shell. That enormous suppression is why a free neutron lives about 15 minutes rather than 10⁻²³ seconds.'),
        drvStep('the shape of the spectrum is itself evidence',
          `${dv('N')}(${dv('E')}) ${dop('∝')} ${dv('p')}${dv('E')}(${dv('Q')}{−}${dv('E')})²`,
          'the panel fits the accumulated histogram and prints the endpoint'),
        drvSay('and the endpoint is how neutrino mass is measured',
          'If the neutrino were massless the spectrum would reach exactly Q. A massive neutrino must take away at least mc², cutting the spectrum short. The KATRIN experiment measures that endpoint on tritium to extraordinary precision, and has so far bounded the neutrino mass below about 0.45 eV.'),
        drvSay('Pauli was wrong about one thing',
          'The neutrino was detected in 1956, twenty-six years after he proposed it and shortly before his death. He had bet a case of champagne that it never would be, and he paid.')
      ],
      note:'The histogram is built from individually simulated decays with the phase-space weighting above, so the shape emerges from sampling rather than being plotted. The endpoint fitted from the accumulated events converges on the true Q value.'
    };
  },
  enter(st, o){
    st.phase = 0; st.pt = 0; st.spectrum = []; st.runs = 0; st.probe = BETA_Q / 2;
    st.own = !!o.own;
    STAGES.atomBeta.enterOwn(st, o);
  },
  controls(){
    const seg = ctSeg('abBM', ST.own ? 'own' : 'n',
                      [['n', 'the free neutron'], ['own', 'name your own nuclides']]);
    if(ST.own) return seg + STAGES.atomBeta.controlsOwn();
    return seg + `<div class="row wrap"><button class="btn pri" id="abGo">Decay a neutron</button>
      <button class="btn sm" id="abMany">Decay ×200 (fill the spectrum)</button></div>
      <p class="help">n → p + e⁻ + ν̄ₑ. Underneath: one down quark emits a W⁻ and becomes up; the W⁻ (2×10⁻²⁵ s later) becomes the electron–antineutrino pair. The released energy Q = 0.782 MeV is <b>shared randomly</b> between e⁻ and ν̄ — the continuous electron spectrum below is why Pauli had to invent the neutrino in 1930.</p>`;
  },
  wire(){
    ctWireSeg('abBM', v => { ST.own = (v === 'own'); });
    if(ST.own) return STAGES.atomBeta.wireOwn();
    $('abGo').addEventListener('click', () => { ST.phase = 1; ST.pt = 0; ST.runs++; ST.lastKe = betaSampleKe(); ST.spectrum.push(ST.lastKe); });
    $('abMany').addEventListener('click', () => { for(let i = 0; i < 200; i++) ST.spectrum.push(betaSampleKe()); ST.runs += 200; });
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.atomBeta.frameOwn(st, dt, ctx, W, H);
    const midY = (H - 40) * 0.34;
    /* ---- Feynman-style diagram, left ---- */
    const fx = 60, fw = W * 0.42;
    ctx.strokeStyle = rgbCss(TH.text, 0.85); ctx.lineWidth = 1.8;
    ctx.font = '600 12px ' + FONT_UI; ctx.textBaseline = 'middle';
    const yD = midY + 46, yU = midY - 46, vX = fx + fw * 0.42;
    /* d in → vertex → u out */
    ctx.beginPath(); ctx.moveTo(fx, yD); ctx.lineTo(vX, midY); ctx.lineTo(fx + fw, yU); ctx.stroke();
    ctx.fillStyle = rgbCss(TH.text); ctx.textAlign = 'right'; ctx.fillText('d (in the neutron)', fx + 118, yD + 14);
    ctx.textAlign = 'left'; ctx.fillText('u (now a proton)', fx + fw - 108, yU - 12);
    /* W propagator: wavy */
    const wEnd = { x: vX + fw * 0.3, y: midY + 62 };
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 1.7;
    ctx.beginPath();
    for(let i = 0; i <= 30; i++){
      const tt = i / 30;
      const x = vX + (wEnd.x - vX) * tt, y = midY + (wEnd.y - midY) * tt + Math.sin(tt * 6 * Math.PI) * 5;
      if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = rgbCss(TH.warn); ctx.fillText('W⁻ (virtual: 80 GeV borrowed for 10⁻²⁵ s)', vX + 12, midY + 30);
    /* e and nu out of the W vertex */
    ctx.strokeStyle = rgbCss(TH.neg); ctx.beginPath(); ctx.moveTo(wEnd.x, wEnd.y); ctx.lineTo(wEnd.x + 90, wEnd.y + 34); ctx.stroke();
    ctx.fillStyle = rgbCss(TH.neg); ctx.fillText('e⁻', wEnd.x + 96, wEnd.y + 36);
    ctx.strokeStyle = rgbCss(TH.faint); ctx.beginPath(); ctx.moveTo(wEnd.x, wEnd.y); ctx.lineTo(wEnd.x + 96, wEnd.y - 6); ctx.stroke();
    ctx.fillStyle = rgbCss(TH.faint); ctx.fillText('ν̄ₑ', wEnd.x + 102, wEnd.y - 8);
    /* animated pulse along the current decay */
    if(st.phase === 1){
      st.pt += dt;
      const tt = Math.min(1, st.pt / 1.6);
      const px = tt < 0.5 ? fx + (vX - fx) * tt * 2 : vX + (wEnd.x - vX) * (tt - 0.5) * 2;
      const py = tt < 0.5 ? yD + (midY - yD) * tt * 2 : midY + (wEnd.y - midY) * (tt - 0.5) * 2;
      ctx.fillStyle = rgbCss(TH.warn);
      ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.fill();
      if(tt >= 1) st.phase = 0;
    }
    /* ---- electron energy spectrum, right ---- */
    const pl = st.pl = mkPlot(W * 0.56, 40, W * 0.40 - 30, H - 40 - 60, 0, BETA_Q, 0, 1.25);
    plotFrame(ctx, pl, 'electron kinetic energy Kₑ (MeV)', '', 'β spectrum · N = ' + st.spectrum.length);
    plotTicksX(ctx, pl, [0, 0.2, 0.4, 0.6, BETA_Q], v => fmtNum(v, 2));
    /* histogram */
    const NB = 30, hist = new Float64Array(NB);
    for(const k of st.spectrum){ const b = Math.min(NB - 1, Math.floor(k / BETA_Q * NB)); hist[b]++; }
    const hm = Math.max(1, ...hist);
    ctx.fillStyle = rgbCss(TH.neg, 0.5);
    for(let i = 0; i < NB; i++){
      const x0 = pl.X(i / NB * BETA_Q), x1 = pl.X((i + 1) / NB * BETA_Q);
      ctx.fillRect(x0 + 1, pl.Y(hist[i] / hm * 1.1), x1 - x0 - 2, pl.py + pl.ph - pl.Y(hist[i] / hm * 1.1));
    }
    /* exact allowed shape, normalised to unit max */
    let smax = 0; const shape = [];
    for(let i = 0; i <= 100; i++){
      const K = i / 100 * BETA_Q, E = K + M_E, p = Math.sqrt(Math.max(0, E * E - M_E * M_E));
      const w = p * E * (BETA_Q - K) ** 2;
      shape.push([K, w]); if(w > smax) smax = w;
    }
    ctx.strokeStyle = rgbCss(TH.accent); ctx.lineWidth = 2;
    ctx.beginPath();
    shape.forEach(([K, w2], i) => { const X = pl.X(K), Y = pl.Y(w2 / smax * 1.1); if(i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
    ctx.stroke();
    probeLine(ctx, pl, st.probe, 'Kₑ');
    stageNote(ctx, 'if the decay were two-body (no neutrino), every electron would carry exactly Q — a single spike, not this curve', W, H);
  },
  pick(st, sx){
    if(st.own) return;
    if(st.pl && st.pl.inside(sx, 0) || true){ if(st.pl) st.probe = Math.max(0, Math.min(BETA_Q, st.pl.invX(sx))); } },
  readout(st){
    if(st.own) return STAGES.atomBeta.readoutOwn(st);
    const K = st.probe, E = K + M_E, p = Math.sqrt(Math.max(0, E * E - M_E * M_E));
    const w = p * E * (BETA_Q - K) ** 2;
    return `<div class="card tight"><div class="ttl">At the probe · Kₑ = ${fmtNum(K, 4)} MeV</div>
      ${kv('spectral weight p·E·(Q−K)²', fmtNum(w, 5))}
      ${kv('ν̄ carries away', fmtNum(BETA_Q - K, 4) + ' MeV')}
    </div>
    <div class="card tight"><div class="ttl">The bookkeeping (real masses)</div>
      ${kv('m(n)', M_N + ' MeV')}
      ${kv('m(p) + m(e)', fmtNum(M_P + M_E, 3) + ' MeV')}
      ${kv('Q = released energy', '<b>' + fmtNum(BETA_Q, 4) + ' MeV</b>')}
      ${kv('free-neutron half-life', '~10.2 min — glacial, because the W is so heavy')}
      ${kv('W⁻ status', 'virtual — borrowed 80 GeV, never detectable')}
      ${kv('e⁻, ν̄ₑ status', 'real — on-shell, they reach detectors')}
      ${st.lastKe !== undefined ? kv('last decay: Kₑ', fmtNum(st.lastKe, 4) + ' MeV') : ''}
      <p class="help">Charge (0 → +1 −1), lepton number (0 → +1 −1) and energy all balance. The same vertex, run in other directions, gives β⁺ decay, electron capture, and the fusion step p+p→d that lights the sun.</p>
    </div>`;
  },
  chip(st){
    if(st.own) return STAGES.atomBeta.chipOwn(st);
    return `<div class="k">β⁻ decay</div><div>Q = ${fmtNum(BETA_Q, 3)} MeV</div><div>N decayed = ${st.spectrum.length}</div>`; },
  legend(st){
    if(st && st.own) return STAGES.atomBeta.legendOwn();
    return [['var(--c-neg)', 'electron spectrum (measured)'], ['var(--accent)', 'allowed shape p·E·(Q−K)² (exact)'], ['var(--c-warn)', 'the virtual W⁻']]; }
};

/* ---- 11 · binding energy: why fusion AND fission both pay ---------------------- */
STAGES.atomBinding = {
  title: 'The curve of binding energy',
  derive(st){
    if(st.own) return STAGES.atomBinding.deriveOwn(st);
    return {
      title:'One curve that determines what stars can do',
      steps:[
        drvStep('binding energy per nucleon, from the mass formula',
          `${dfrac(dv('B'), dv('A'))}`,
          `at A = ${st.probe} the panel evaluates it at the most stable Z`),
        drvSay('the sign convention causes endless confusion',
          'Binding energy is how much you must supply to take the nucleus apart. A larger B/A means more tightly bound and therefore lower in energy. Moving *up* this curve releases energy, which is why it is drawn with the most stable nucleus at the top.'),
        drvStep('fusion climbs the steep left side',
          `light nuclei ${dop('→')} heavier`,
          'D + T releases 17.6 MeV from five nucleons — about 3.5 MeV each'),
        drvStep('and fission slides down the gentle right side',
          `²³⁵U ${dop('→')} two fragments`,
          'about 200 MeV per event, but only 0.9 MeV per nucleon'),
        drvSay('so fusion is better per nucleon and fission better per event',
          'Fission moves 235 nucleons a short way up; fusion moves five nucleons a long way. That is why a fission event releases more energy while fusion fuel is the more energetic per kilogram — the two figures answer different questions.'),
        drvStep('the peak is where the two trends cross',
            `surface term favours large ${dv('A')}, Coulomb punishes it`,
          'the panel locates the peak by scanning — it lands in the iron–nickel region'),
        drvSay('and that peak is why stars have a life cycle',
          'A star fuses its way up the curve, releasing energy at every step, and stops at iron because going further would cost energy rather than release it. The core, no longer supported, collapses — and the supernova that follows makes everything heavier than iron.'),
        drvStep('so the elements have two distinct origins',
          `up to iron: stellar fusion. Beyond: supernovae and neutron-star mergers`,
          'the panel marks where the transition falls on the curve'),
        drvSay('which is a fact about the atoms in your hand',
          'The carbon and oxygen in you were made by fusion in a star that lived and died. The iodine in your thyroid and the gold in a ring were made in a supernova or a collision of neutron stars. The shape of this curve is why those are different stories.')
      ],
      note:'The curve is computed from the semi-empirical mass formula, minimised over Z at each mass number, and plotted against measured binding energies. The nuclear-physics wing derives the five terms one at a time and scores the model against AME2020.'
    };
  },
  enter(st, o){
    st.probe = 56;
    st.own = !!o.own;
    STAGES.atomBinding.enterOwn(st, o);
  },
  controls(){
    const seg = ctSeg('abM', ST.own ? 'own' : 'std',
                      [['std', 'the curve as it stands'], ['own', 'fit your own coefficients']]);
    if(ST.own) return seg + STAGES.atomBinding.controlsOwn();
    return seg + `<p class="help">B/A from the semi-empirical mass formula at each nucleus's best Z. Energy is released whenever nucleons move <b>up</b> this curve: light nuclei fuse (the sun), heavy nuclei fission (reactors). Iron-56 sits at the top with nothing left to give — which is why stars die when their cores turn to iron.</p>`;
  },
  wire(){
    ctWireSeg('abM', v => { ST.own = (v === 'own'); });
    if(ST.own) STAGES.atomBinding.wireOwn();
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.atomBinding.frameOwn(st, dt, ctx, W, H);
    const pl = st.pl = mkPlot(64, 46, W - 94, H - 46 - 44, 0, 250, 0, 9.5);
    plotFrame(ctx, pl, 'mass number A', 'B/A (MeV per nucleon)', 'binding energy per nucleon (SEMF, best Z)');
    plotTicksX(ctx, pl, [0, 50, 100, 150, 200, 250]);
    plotCurve(ctx, pl, A => A < 1 ? NaN : semfB(Math.round(A), semfBestZ(Math.round(A))) / Math.round(A), 250, rgbCss(TH.accent), 2.2);
    /* real landmark nuclei (measured values, not SEMF) */
    const marks = [[2, 1.112, '²H'], [4, 7.074, '⁴He'], [12, 7.680, '¹²C'], [56, 8.790, '⁵⁶Fe'], [62, 8.795, '⁶²Ni'], [235, 7.591, '²³⁵U']];
    ctx.font = '600 10.5px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for(const [A, b, nm] of marks){
      ctx.fillStyle = rgbCss(TH.pos);
      ctx.beginPath(); ctx.arc(pl.X(A), pl.Y(b), 3.5, 0, 6.2832); ctx.fill();
      ctx.fillText(nm, pl.X(A), pl.Y(b) - 6);
    }
    /* fusion / fission arrows */
    ctx.fillStyle = rgbCss(TH.grad); ctx.font = '600 11px ' + FONT_UI;
    ctx.fillText('fusion →', pl.X(18), pl.Y(4.4));
    ctx.fillText('← fission', pl.X(200), pl.Y(6.9));
    probeLine(ctx, pl, st.probe, 'A = ' + Math.round(st.probe));
    stageNote(ctx, 'the shape is a tug-of-war: volume term (strong force, +) vs surface leakage and Coulomb repulsion (−) — the curve IS the four-force ledger, integrated', W, H);
  },
  pick(st, sx){ if(st.pl) st.probe = Math.max(1, Math.min(250, st.pl.invX(sx))); },
  readout(st){
    if(st.own) return STAGES.atomBinding.readoutOwn(st);
    const A = Math.max(1, Math.round(st.probe)), Z = semfBestZ(A);
    const aV = 15.75 * A, aS = -17.8 * Math.pow(A, 2 / 3), aC = -0.711 * Z * (Z - 1) / Math.pow(A, 1 / 3), aA = -23.7 * (A - 2 * Z) ** 2 / A;
    return `<div class="card tight"><div class="ttl">A = ${A} · most stable Z = ${Z}</div>
      ${kv('B/A', '<b>' + fmtNum(semfB(A, Z) / A, 4) + ' MeV</b>')}
      ${kv('total B', fmtNum(semfB(A, Z), 2) + ' MeV')}
    </div>
    <div class="card tight"><div class="ttl">The five terms (MeV)</div>
      ${kv('volume +15.75·A (strong)', fmtNum(aV, 1))}
      ${kv('surface −17.8·A^⅔', fmtNum(aS, 1))}
      ${kv('Coulomb −0.711·Z²/A^⅓ (EM)', fmtNum(aC, 1))}
      ${kv('asymmetry −23.7·(A−2Z)²/A (Pauli)', fmtNum(aA, 1))}
      <p class="help">Each nucleon only feels neighbours (strong force saturates) so volume binding is linear in A — but every proton repels every other, so Coulomb grows as Z². That mismatch is the entire story of the periodic table's upper end.</p>
      <p class="help" style="color:var(--faint)">A detail usually glossed over: the true maximum of B/A is <b>⁶²Ni</b> at 8.7945 MeV, a hair above ⁵⁶Fe's 8.7903. Iron still dominates stellar ash because what a collapsing core actually minimises is free energy at fixed proton fraction under photodisintegration, not B/A — so "the iron peak" is a statement about abundance, and nickel wins the binding contest by 4 keV per nucleon.</p>
    </div>`;
  },
  chip(st){
    if(st.own) return STAGES.atomBinding.chipOwn(st);
    const A = Math.max(1, Math.round(st.probe)), Z = semfBestZ(A);
    return `<div class="k">binding energy</div><div>A = ${A}, Z = ${Z}</div><div style="color:var(--c-pos)">B/A = ${fmtNum(semfB(A, Z) / A, 3)} MeV</div>`;
  },
  legend(st){
    if(st && st.own) return STAGES.atomBinding.legendOwn();
    return [['var(--accent)', 'B/A — semi-empirical mass formula'], ['var(--c-pos)', 'measured landmark nuclei']]; }
};

/* ---- 12 · the Pauli exclusion principle ---------------------------------------- */
/* Two identical particles in the same box. The only thing we change is the SIGN
   in Psi(x1,x2) = phi_a(x1)phi_b(x2) +/- phi_a(x2)phi_b(x1) - and that sign decides
   whether matter stacks (bosons) or builds shells and volume (fermions). */
