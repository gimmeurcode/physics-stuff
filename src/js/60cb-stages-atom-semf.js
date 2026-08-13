/* ============================================================================
   3kb · THE MASS FORMULA'S COEFFICIENTS, FITTED BY THE READER

   `atomBinding` draws a curve that agrees with the measured nuclides because
   Wapstra fitted it in the 1960s and the five numbers have been constants ever
   since. Handing the reader those five numbers turns three separate assertions
   into measurements:

     · the curve's agreement with nature becomes an RMS residual, scored against
       AME2020 — and the reader's set can be worse, or better;
     · the coefficients stop being given. B is linear in all five, so the best
       possible set is a 5×5 solve, and the panel prints it beside the reader's;
     · the iron peak stops being a fact about iron. It is where the surface term
       stops beating the Coulomb term, and halving aC moves it to A = 118.

   The fit has a lesson in it that a preset could not deliver. Least squares on
   this table beats Wapstra by a factor of three on the nuclides it was shown —
   and returns a pairing coefficient of 51 MeV, four times the real one, because
   the table has almost no odd–odd nuclei and nothing in the data constrains it.
   The panel measures that directly, by moving each coefficient a tenth and
   watching what happens to the residual, and says which of the five the fit is
   entitled to claim.

   Prefix: nc for the engine (44ab), atom for the stage.
   ============================================================================ */

const NC_SEMF_PRESETS = [
  { k:'wapstra', label:'the standard set', C:NC_SEMF },
  { k:'nosurf',  label:'no surface term',  C:{ ...NC_SEMF, aS:0 } },
  { k:'nocoul',  label:'no Coulomb term',  C:{ ...NC_SEMF, aC:0 } },
  { k:'halfc',   label:'half the Coulomb', C:{ ...NC_SEMF, aC:NC_SEMF.aC / 2 } }
];
const NC_FIT_MINA = 16;

STAGES.atomBinding.enterOwn = function(st, o){
  st.sheet = o.sheet || ncSemfSheet(NC_SEMF);
  st.sheetErr = '';
  st.C = { ...NC_SEMF };
  STAGES.atomBinding.applySheet(st);
};
STAGES.atomBinding.applySheet = function(st){
  const P = ncParseSemf(st.sheet);
  if(P.ok){ st.C = P.C; st.sheetErr = ''; }
  else st.sheetErr = '⚠ ' + P.errs.slice(0, 4)
    .map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
    '<br><span style="color:var(--faint)">The previous coefficients are still shown.</span>';
  return P;
};
/* Everything the panel needs, keyed on the coefficients: a scan over 250 mass
   numbers with an inner search over Z is a quarter of a million evaluations,
   and `readout` runs about four times a second. */
STAGES.atomBinding.reportOf = function(st){
  const key = NC_SEMF_KEYS.map(k => st.C[k]).join('|');
  if(st._rk === key) return st._rd;
  st._rk = key;
  const score = ncSemfScore(st.C, NC_FIT_MINA);
  const peak = ncSemfPeak(st.C, NC_FIT_MINA);
  /* the closed-form valley against a brute-force search, which keeps the
     pairing term the closed form had to drop */
  const valley = [20, 56, 100, 150, 208, 238].map(A => {
    const zc = ncValleyZWith(st.C, A), zb = ncMostBoundZWith(st.C, A).Z;
    return { A, zc, zb, gap:Math.abs(zc - zb), evenZ:zb % 2 === 0 };
  });
  st._rd = { score, peak, valley,
             worstGap:valley.reduce((a, v) => Math.max(a, v.gap), 0),
             std:ncSemfScore(NC_SEMF, NC_FIT_MINA) };
  return st._rd;
};
STAGES.atomBinding.fitOf = function(){
  if(!STAGES.atomBinding._fit) STAGES.atomBinding._fit = ncSemfFit(NC_FIT_MINA);
  return STAGES.atomBinding._fit;
};
/* The standard set's curve is a constant of the site, and `ncSemfPeak` costs a
   search over Z at each of 260 mass numbers — about 33,000 evaluations of the
   mass formula. It was being recomputed inside `frame`, i.e. sixty times a
   second, to draw a dashed line that never changes; the stage ran at half the
   frame rate of every other one because of it. */
STAGES.atomBinding.stdPeak = function(){
  if(!STAGES.atomBinding._std) STAGES.atomBinding._std = ncSemfPeak(NC_SEMF, NC_FIT_MINA);
  return STAGES.atomBinding._std;
};

STAGES.atomBinding.controlsOwn = function(){
  const st = ST;
  return `<div class="fld" style="align-items:stretch">
    <textarea id="abSemf" rows="5" spellcheck="false" autocomplete="off"
      aria-label="mass formula coefficients — one per line, in MeV"
      data-audit="aV 16.1&#10;aS 19.4&#10;aC 0.66&#10;aA 22.1&#10;aP 11.18"
      style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
  </div>
  <div class="row wrap">${ctBtn('abSemfGo', 'Score it')}${ctBtn('abSemfFit', 'Fit it to the data')}
    ${ctBtn('abSemfStd', 'Back to Wapstra')}</div>
  <p class="help" id="abSemfMsg" style="color:${st.sheetErr ? 'var(--c-neg)' : 'var(--faint)'}">${
    st.sheetErr || 'Five coefficients in MeV: <b>aV</b> volume, <b>aS</b> surface, <b>aC</b> Coulomb, <b>aA</b> asymmetry, <b>aP</b> pairing. Each is scored against the ' + NC_NUCLIDES.length + ' measured nuclides.'}</p>` +
  /* highlight whichever set is actually loaded, matched on the coefficients
     rather than on the text, so retyping the standard numbers by hand still
     lights the standard chip */
  ctSeg('abSemfP', (NC_SEMF_PRESETS.find(p =>
          NC_SEMF_KEYS.every(k => Math.abs(p.C[k] - st.C[k]) < 1e-9)) || {}).k || 'none',
        NC_SEMF_PRESETS.map(p => [p.k, p.label])) +
  `<p class="help">The curve you are looking at is normally drawn with somebody
  else's five numbers. Change them and it is <b>your</b> model being scored: the
  panel prints the RMS residual against AME2020, beside Wapstra's and beside the
  least-squares optimum for the same nuclides.</p>
  <p class="help"><b>Delete the surface term</b> and the peak disappears — nothing
  then punishes small nuclei, so B/A rises for ever. <b>Halve the Coulomb term</b>
  and the peak moves from iron to A ≈ 118. "Iron is the most bound nucleus" is a
  statement about two coefficients, and this is the only way to see it.</p>`;
};
STAGES.atomBinding.wireOwn = function(){
  const apply = () => {
    const box = $('abSemf'); if(!box) return;
    ST.sheet = box.value;
    const P = STAGES.atomBinding.applySheet(ST);
    const msg = $('abSemfMsg');
    if(msg){
      msg.innerHTML = ST.sheetErr || ('Scored: RMS ' +
        fmtNum(STAGES.atomBinding.reportOf(ST).score.rms, 4) + ' MeV per nucleon over the ' +
        STAGES.atomBinding.reportOf(ST).score.n + ' nuclides above A = ' + NC_FIT_MINA + '.');
      msg.style.color = ST.sheetErr ? 'var(--c-neg)' : 'var(--faint)';
    }
    refreshStageReadout(); updateStageChip();
  };
  const b = $('abSemf'); if(b) b.addEventListener('change', apply);
  const g = $('abSemfGo'); if(g) g.addEventListener('click', apply);
  const f = $('abSemfFit');
  if(f) f.addEventListener('click', () => {
    const F = STAGES.atomBinding.fitOf();
    ST.sheet = ncSemfSheet(F.C);
    STAGES.atomBinding.applySheet(ST);
    buildStagePanel(); refreshStageReadout(); updateStageChip();
  });
  const s = $('abSemfStd');
  if(s) s.addEventListener('click', () => {
    ST.sheet = ncSemfSheet(NC_SEMF);
    STAGES.atomBinding.applySheet(ST);
    buildStagePanel(); refreshStageReadout(); updateStageChip();
  });
  ctWireSeg('abSemfP', v => {
    const P = NC_SEMF_PRESETS.find(p => p.k === v);
    if(!P) return;
    ST.sheet = ncSemfSheet(P.C);
    STAGES.atomBinding.applySheet(ST);
  });
};
STAGES.atomBinding.frameOwn = function(st, dt, ctx, W, H){
  const R = STAGES.atomBinding.reportOf(st);
  /* The axis follows the model — a set that produces −5 MeV per nucleon must be
     visible as such — but only over the mass numbers the model is meant for.
     Letting A = 2 into this made the range −25 to 10 for the STANDARD
     coefficients, squashing the entire curve of binding energy into the top
     fifth of the panel to leave room for a liquid drop's opinion of deuterium. */
  let lo = 0, hi = 9.5;
  for(const c of R.peak.curve) if(c.A >= 12){ lo = Math.min(lo, c.perA); hi = Math.max(hi, c.perA); }
  lo = Math.max(-12, Math.floor(lo)); hi = Math.min(30, Math.ceil(hi + 0.5));
  const pl = st.pl = mkPlot(64, 46, W - 94, H - 46 - 44, 0, 250, lo, hi);
  plotFrame(ctx, pl, 'mass number A', 'B/A (MeV per nucleon)',
            'your coefficients, scored against the measured nuclides');
  plotTicksX(ctx, pl, [0, 50, 100, 150, 200, 250]);
  /* Wapstra's curve underneath, so the reader's is a departure from something */
  /* A curve that leaves the axis is BROKEN rather than clamped: pinning it to
     the boundary draws a horizontal line at −12 MeV per nucleon that looks like
     a prediction and is an artefact of the clamp. */
  const drawCurve = (curve, col, w, dash) => {
    ctx.strokeStyle = col; ctx.lineWidth = w;
    if(dash) ctx.setLineDash(dash);
    ctx.beginPath();
    let on = false;
    for(const c of curve){
      /* the scan runs to A = 260 and the axis stops at 250, so without this the
         curve is drawn past the right-hand frame and over the tick labels */
      if(c.A < 4 || c.A > 250 || !Number.isFinite(c.perA) ||
         c.perA < lo || c.perA > hi){ on = false; continue; }
      const x = pl.X(c.A), y = pl.Y(c.perA);
      if(on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; }
    }
    ctx.stroke();
    if(dash) ctx.setLineDash([]);
  };
  drawCurve(STAGES.atomBinding.stdPeak().curve, rgbCss(TH.dim, 0.55), 1.3, [5, 4]);
  drawCurve(R.peak.curve, rgbCss(TH.accent), 2.2, null);
  /* the measured nuclides, with a stick to the model — the residual, drawn */
  for(const r of R.score.rows){
    const x = pl.X(r.A), ym = pl.Y(r.bpa);
    if(Number.isFinite(r.model)){
      /* a residual running off the axis is drawn to the edge and dashed, so a
         point whose model value is nowhere near it still says so */
      const off = r.model < lo || r.model > hi;
      ctx.strokeStyle = rgbCss(TH.neg, off ? 0.5 : 0.75); ctx.lineWidth = 1.6;
      if(off) ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, ym);
      ctx.lineTo(x, pl.Y(Math.max(lo, Math.min(hi, r.model)))); ctx.stroke();
      if(off) ctx.setLineDash([]);
    }
    ctx.fillStyle = rgbCss(r.used ? TH.pos : TH.faint);
    ctx.beginPath(); ctx.arc(x, ym, 3.4, 0, 6.2832); ctx.fill();
  }
  /* the peak this coefficient set predicts */
  if(R.peak.A > 0 && !R.peak.edge){
    ctx.strokeStyle = rgbCss(TH.curl, 0.8); ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pl.X(R.peak.A), pl.Y(lo)); ctx.lineTo(pl.X(R.peak.A), pl.Y(hi)); ctx.stroke();
    ctx.setLineDash([]);
    ctText(ctx, pl.X(R.peak.A) + 6, pl.Y(hi) + 12,
           'peak at A = ' + R.peak.A + ' (Z = ' + R.peak.Z + ')',
           rgbCss(TH.curl), '600 11px ' + FONT_UI, 'left', 'top');
  }
  /* inside the plot, top right — H − 46 sat exactly on the x-axis title */
  ctText(ctx, pl.X(248), pl.Y(hi) + 8,
         'RMS residual ' + fmtNum(R.score.rms, 4) + ' MeV per nucleon over A ≥ ' + NC_FIT_MINA,
         rgbCss(TH.text), '600 12px ' + FONT_UI, 'right', 'top');
  ctText(ctx, pl.X(248), pl.Y(hi) + 24,
         'the standard set scores ' + fmtNum(R.std.rms, 4),
         rgbCss(TH.dim), '600 11px ' + FONT_UI, 'right', 'top');
  stageNote(ctx, 'the red sticks are the residuals — the model is being scored, not illustrated', W, H);
};
STAGES.atomBinding.readoutOwn = function(st){
  const R = STAGES.atomBinding.reportOf(st), F = STAGES.atomBinding.fitOf();
  const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 4 : d) : 'not defined there');
  const better = R.score.rms < R.std.rms;
  const worstV = R.valley.reduce((a, v) => (v.gap > a.gap ? v : a), R.valley[0]);
  return `<div class="card tight"><div class="ttl">Your coefficients, scored</div>
    ${NC_SEMF_KEYS.map(k => kv(k, n(st.C[k], 5) + ' MeV' +
      (Math.abs(st.C[k] - NC_SEMF[k]) > 1e-9 ? '   (standard ' + n(NC_SEMF[k], 4) + ')' : ''))).join('')}
    ${kv('RMS residual, A ≥ ' + NC_FIT_MINA, '<b>' + n(R.score.rms, 4) + ' MeV per nucleon</b> over ' + R.score.n + ' nuclides')}
    ${kv('the standard set scores', n(R.std.rms, 4))}
    ${kv('the least-squares best possible', n(F.ok ? F.score.rms : NaN, 4))}
    ${kv('worst single nuclide', R.score.worst ? R.score.worst.s + ': model ' + n(R.score.worst.model, 5) +
      ' against ' + n(R.score.worst.bpa, 5) + ', out by ' + n(R.score.worst.resid, 3) : '—')}
    <p class="help">${better
      ? 'Your set beats Wapstra\'s on this table. Whether it beats it on the four thousand nuclides that are not in the table is a different question, and the fit below is the reason to ask it.'
      : 'Wapstra\'s five numbers were themselves fitted, to far more data than the sixteen nuclides here. The gap between your residual and the least-squares one is how much of the model\'s accuracy is in the choice of coefficients rather than in the shape of the formula.'}</p>
  </div>
  <div class="card tight"><div class="ttl">Where the peak falls</div>
    ${kv('your most bound nucleus', R.peak.edge
      ? 'no interior maximum — B/A only falls, so the lightest nucleus wins'
      : 'A = ' + R.peak.A + ', Z = ' + R.peak.Z + ',  B/A = ' + n(R.peak.perA, 5))}
    ${kv('with the standard coefficients', 'A = ' + STAGES.atomBinding.stdPeak().A)}
    ${kv('the measured champion', R.peak.measured.s + ' at ' + n(R.peak.measured.bpa, 5) + ' MeV per nucleon')}
    <p class="help">${R.peak.edge
      ? 'There is no peak. The maximum found sits on the end of the range, which means B/A has no interior maximum at all for these coefficients — and a curve with no maximum has no fission, no fusion cutoff, and no reason for stars to stop. That is what the surface term is for.'
      : 'The peak is not an input to the model and not a property of iron. It is where the surface term, which costs A^(2/3) and so matters less as nuclei grow, stops outrunning the Coulomb term, which costs Z²/A^(1/3) and so matters more.'}
    Set <b>aS = 0</b> and the maximum disappears entirely — nothing is left to punish a small nucleus,
    so B/A simply falls from aV. Halve <b>aC</b> and the peak slides from iron to A ≈ 118.
    The measured champion is ⁶²Ni, not ⁵⁶Fe — and the least-squares set predicts A = 62 where the
    standard one predicts 58, which is the fit landing on the right nucleus.</p>
  </div>
  <div class="card tight"><div class="ttl">The valley of stability, two ways</div>
    ${R.valley.map(v => kv('A = ' + v.A, 'closed form Z = ' + n(v.zc, 4) +
      ',  search says ' + v.zb + (v.gap > 0.5 ? '  — apart by ' + n(v.gap, 3) : ''))).join('')}
    ${kv('worst disagreement', n(R.worstGap, 4) + ' protons' +
      (worstV && worstV.gap > 0.5 ? ', at A = ' + worstV.A + ' where the search picks an ' +
        (worstV.evenZ ? 'even' : 'odd') + ' Z' : ''))}
    <p class="help">Setting dB/dZ = 0 at fixed A and solving gives Z*(A) in closed form — but only
    after dropping the pairing term, which is not differentiable in Z. The brute-force search keeps
    it, and looks at every Z from 1 to A. The two share no line of code, so their agreement to within
    a proton is the algebra confirmed; where they differ most, the search has taken the even-Z
    neighbour, which is exactly the term the closed form had to throw away.</p>
  </div>
  <div class="card tight"><div class="ttl">What the data can actually pin down</div>
    ${F.ok ? NC_SEMF_KEYS.map((k, i) => kv(k + ' fitted', n(F.C[k], 5) +
      '   — a 10% change costs ×' + n(F.sens[i].ratio, 3) + ' on the residual')).join('') : ''}
    <p class="help">These are the five numbers least squares chooses when shown the ${F.n} nuclides
    above A = ${NC_FIT_MINA}, and the second column is how hard the data pushes back on each: move it
    a tenth and see what the residual does. <b>aV</b> is pinned hardest. <b>aP</b> is barely pinned at
    all, and the fitted value comes out around four times the real one — this table contains almost no
    odd–odd nuclei, so nothing in it constrains the pairing term. A fit that beats Wapstra by three
    times on the data it was shown is still not entitled to claim all five of its numbers, and the
    only honest way to know which is to measure it.</p>
  </div>`;
};
STAGES.atomBinding.chipOwn = function(st){
  const R = STAGES.atomBinding.reportOf(st);
  return `<div class="k">your mass formula</div><div>RMS = ${fmtNum(R.score.rms, 4)} MeV/A</div>
    <div style="color:var(--c-curl)">${R.peak.edge ? 'no peak at all' : 'peak at A = ' + R.peak.A}</div>`;
};
STAGES.atomBinding.legendOwn = function(){
  return [['var(--accent)', 'B/A from your coefficients'],
          ['var(--dim)', 'the standard set, for comparison'],
          ['var(--c-pos)', 'measured nuclides (AME2020)'],
          ['var(--c-neg)', 'the residual — what your set is scored on'],
          ['var(--c-curl)', 'the peak your coefficients predict']];
};
STAGES.atomBinding.deriveOwn = function(st){
  const R = STAGES.atomBinding.reportOf(st), F = STAGES.atomBinding.fitOf();
  const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 4 : d) : 'not defined there');
  return {
    title:'Five numbers that were measured, and what happens when you change them',
    steps:[
      drvSay('the curve on the preset panel agrees with nature for a reason worth stating',
        'Somebody fitted it. The five coefficients were chosen in the 1960s to minimise exactly the residual this panel prints, against far more data than the sixteen nuclides here. Drawing that curve over the measured points and observing that it passes through them is therefore not evidence of anything — it is the fit, being displayed.'),
      drvStep('the formula, with the coefficients left as symbols',
        `${dv('B')} ${dop('=')} a_V${dv('A')} ${dop('−')} a_S${dv('A')}^(2/3) ${dop('−')} a_C${dfrac(dv('Z') + '(' + dv('Z') + '−1)', dv('A') + '^(1/3)')} ${dop('−')} a_A${dfrac('(' + dv('N') + '−' + dv('Z') + ')²', dv('A'))} ${dop('±')} ${dfrac('a_P', '√' + dv('A'))}`,
        'yours: ' + NC_SEMF_KEYS.map(k => k + ' = ' + n(st.C[k], 5)).join(',  ')),
      drvStep('scored against the measured binding energies',
        `RMS ${dop('=')} √(⟨(${dv('B')}/${dv('A')}|model ${dop('−')} ${dv('B')}/${dv('A')}|measured)²⟩)`,
        n(R.score.rms, 4) + ' MeV per nucleon, against ' + n(R.std.rms, 4) + ' for the standard set'),
      drvSay('the residual is taken per nucleon, and that is a choice with a reason',
        'A residual in total binding energy would be dominated by uranium, for the trivial reason that it has 238 nucleons to be wrong about. Per nucleon is the quantity whose 8.8 MeV plateau is the physics, and the quantity the curve is plotted in.'),
      drvStep('B is linear in all five, so the best possible set is a linear solve',
        `${dv('B')}/${dv('A')} ${dop('=')} Σ c_i g_i(${dv('Z')}, ${dv('A')})/${dv('A')} ${dop('⇒')} (GᵀG)c ${dop('=')} Gᵀy`,
        F.ok ? 'least squares gives RMS ' + n(F.score.rms, 4) + ' — the floor for this formula on this data' : ''),
      drvSay('and the optimum arrives carrying a warning',
        'Least squares on this table beats the standard set by a factor of three, and returns a pairing coefficient of about 51 MeV where the real one is 11. The table has almost no odd–odd nuclei in it, so the pairing column barely varies and the fit can put anything there at no cost. A smaller residual is not a better model, and the way to tell them apart is to perturb each coefficient and watch what the data does about it.'),
      drvStep('so measure how hard the data pushes back on each',
        `∂(RMS)/∂c_i, as a ratio on a 10% change`,
        F.ok ? NC_SEMF_KEYS.map((k, i) => k + ' ×' + n(F.sens[i].ratio, 3)).join(',  ') : ''),
      drvStep('the peak, located rather than quoted',
        `max over ${dv('A')} of ${dv('B')}/${dv('A')}, with ${dv('Z')} free at each ${dv('A')}`,
        R.peak.edge ? 'no interior maximum at all for these coefficients'
          : 'A = ' + R.peak.A + ' at Z = ' + R.peak.Z + '; the standard set gives A = ' +
            STAGES.atomBinding.stdPeak().A),
      drvSay('which is what makes the iron peak a result rather than a fact',
        'Nothing in the formula knows about iron. The maximum is where the surface term, whose cost per nucleon falls as A^(−1/3), stops beating the Coulomb term, whose cost per nucleon grows as A^(2/3). Delete the surface term and the maximum vanishes: B/A falls monotonically from a_V, the lightest nucleus is the most bound, and there is no such thing as fission. Halve the Coulomb term and the most bound nucleus moves to around tin. Stars stop at iron because of the ratio of two numbers in the line above.'),
      drvStep('and the valley of stability, in closed form and by search',
        `${dfrac('∂' + dv('B'), '∂' + dv('Z'))} ${dop('=')} 0 ${dop('⇒')} ${dv('Z')}* ${dop('=')} ${dfrac('4a_A ' + dop('+') + ' a_C' + dv('A') + '^(−1/3)', '8a_A/' + dv('A') + ' ' + dop('+') + ' 2a_C' + dv('A') + '^(−1/3)')}`,
        'the two agree to within ' + n(R.worstGap, 3) + ' of a proton across six mass numbers'),
      drvSay('the disagreement is the pairing term, and it is supposed to be there',
        'Z* had to be derived with the pairing term dropped, because ±a_P/√A is a step function of the parity of Z and has no derivative to set to zero. The search keeps it and tries every Z from 1 to A. The two never differ by as much as a whole proton, and where they differ most the search has taken the even-Z neighbour — so the gap between them is not error, it is precisely the term the calculus could not see.')
    ],
    note:'Every number on this panel is computed from the five coefficients in the box: the residual against AME2020, the least-squares optimum for the same nuclides, the sensitivity of the residual to each coefficient, the location of the peak, and the valley of stability by two routes that share no code.'
  };
};
