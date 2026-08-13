/* ============================================================================
   3kc · WHETHER A NUCLIDE THE READER NAMES CAN DECAY

   The β stage decays a free neutron with Q = 0.782 MeV written in as a
   constant. Naming a nuclide instead turns that constant into a result, and
   three things become measurable that a fixed Q hides:

     · Q by two arithmetics. Subtracting two atomic masses near 200 GeV to get
       1 MeV throws away five significant figures; the same identity rearranged,
       Q(β⁻) = (m_n − m_H) + ΔB, never forms a large number at all. The panel
       prints both and the digits lost.
     · The neutron's 0.782 turns out to BE m_n − m_H, the constant in that
       identity, arrived at by setting both binding energies to zero.
     · Where a chain settles, by three routes: following the decays up from
       Z = 1, following them down from Z = A−1, and minimising the mass — then
       against the closed-form Z* from dB/dZ = 0.

   And it exposes a methodological point the preset cannot: a Q assembled from
   one measured binding energy and one modelled one is not a compromise between
   them. The liquid drop is out by several MeV in places and the Q values being
   decided are of order one, so the panel labels every channel measured, model
   or MIXED, and runs the chain in a single consistent source.

   Prefix: nc for the engine (44ab), atom for the stage.
   ============================================================================ */

const NC_BETA_EXAMPLES = [
  /* ³H → ³He is the one β pair on this site with a measured binding energy at
     both ends, so it is the only one whose Q is a result rather than a model's
     opinion — and it comes out at 18.58 keV, which is the endpoint KATRIN is
     built to measure. It goes first for that reason. */
  { k:'measured', label:'the one fully measured pair', text:'H3\nn\nP32' },
  { k:'famous',   label:'the famous ones',             text:'n\nH3\nC14\nK40\nCo60' },
  { k:'chain',    label:'a chain with a trap in it',   text:'P32\nS32\nSi32' },
  { k:'heavy',    label:'the heavy end',               text:'U238\nTh232\nRa226' }
];
/* what the panel is entitled to say, given where the binding energies came from */
function ncBetaVerdict(q){
  if(q.trust === 'undecided')
    return q.stable
      ? 'no channel opens — but one end of that is modelled, so it settles nothing'
      : 'looks like ' + q.allowed.join(', ') + ' — but one end is modelled, so it settles nothing';
  const how = q.trust === 'measured' ? '' : ' (the model\'s answer)';
  return (q.stable ? 'no channel opens' : q.allowed.join(', ')) + how;
}

STAGES.atomBeta.enterOwn = function(st, o){
  st.sheet = o.sheet || NC_BETA_EXAMPLES[0].text;
  st.sheetErr = '';
  st.list = [{ Z:0, A:1, label:'n' }];
  STAGES.atomBeta.applySheet(st);
};
STAGES.atomBeta.applySheet = function(st){
  const P = ncParseNuclides(st.sheet);
  if(P.ok){ st.list = P.list; st.sheetErr = ''; }
  else st.sheetErr = '⚠ ' + P.errs.slice(0, 4)
    .map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
    '<br><span style="color:var(--faint)">The previous list is still shown.</span>';
  return P;
};
STAGES.atomBeta.reportOf = function(st){
  const key = st.list.map(l => l.Z + '/' + l.A).join(',');
  if(st._bk === key) return st._bd;
  st._bk = key;
  const rows = st.list.map(l => ({ ...l, q:ncBetaQ(l.Z, l.A) }));
  /* The chain is drawn at the first mass number that HAS a chain. A = 3 has two
     isobars and draws as two dots and a line, which is a picture of nothing;
     tritium is the most interesting row in the table and the least interesting
     parabola on the site. */
  const first = st.list.find(l => l.A >= 12) ||
                st.list.filter(l => l.A >= 3).sort((a, b) => b.A - a.A)[0] ||
                st.list[0] || { Z:0, A:1 };
  st._bd = { rows, isobar:ncIsobar(Math.max(3, Math.min(260, first.A))), first };
  return st._bd;
};
STAGES.atomBeta.controlsOwn = function(){
  const st = ST;
  return `<div class="fld" style="align-items:stretch">
    <textarea id="abNuc" rows="5" spellcheck="false" autocomplete="off"
      aria-label="nuclides — one per line, like C14 or 40K"
      data-audit="Na22&#10;Be7&#10;Sr90"
      style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
  </div>
  <div class="row wrap">${ctBtn('abNucGo', 'Work out the Q values')}</div>
  <p class="help" id="abNucMsg" style="color:${st.sheetErr ? 'var(--c-neg)' : 'var(--faint)'}">${
    st.sheetErr || 'One nuclide per line — <b>C14</b>, <b>40K</b>, <b>n</b>. Each is tested for β⁻, β⁺ and electron capture by summing masses.'}</p>` +
  /* the chip for whichever example is actually showing, so choosing one leaves a
     mark — a segmented control that never highlights anything looks broken */
  ctSeg('abNucP', (NC_BETA_EXAMPLES.find(p => p.text.trim() === String(st.sheet).trim()) || {}).k || 'none',
        NC_BETA_EXAMPLES.map(p => [p.k, p.label])) +
  `<p class="help">Nothing here is looked up. Each Q is a difference of atomic
  masses, and those masses are built from binding energies — measured where the
  nuclide is in the AME2020 table, and predicted by the liquid-drop model
  otherwise. The panel says which, per channel, because <b>a Q with one measured
  end and one modelled end is worth nothing at all</b>: the model's error is
  several MeV and the answers are of order one.</p>
  <p class="help">The picture is the mass parabola at the first nuclide's mass
  number, drawn from the model alone so that the whole chain is on one footing.
  Odd–odd nuclei sit on the upper branch and even–even on the lower, split by
  twice the pairing term — which is why some mass numbers have two stable
  nuclides and their odd neighbour has none.</p>`;
};
STAGES.atomBeta.wireOwn = function(){
  const apply = () => {
    const box = $('abNuc'); if(!box) return;
    ST.sheet = box.value;
    const P = STAGES.atomBeta.applySheet(ST);
    const msg = $('abNucMsg');
    if(msg){
      msg.innerHTML = ST.sheetErr || ('Read ' + P.list.length + ' nuclide' +
        (P.list.length === 1 ? '' : 's') + ': ' + P.list.map(l => l.label).join(', '));
      msg.style.color = ST.sheetErr ? 'var(--c-neg)' : 'var(--faint)';
    }
    refreshStageReadout(); updateStageChip();
  };
  const b = $('abNuc'); if(b) b.addEventListener('change', apply);
  const g = $('abNucGo'); if(g) g.addEventListener('click', apply);
  ctWireSeg('abNucP', v => {
    const P = NC_BETA_EXAMPLES.find(p => p.k === v);
    if(!P) return;
    ST.sheet = P.text;
    STAGES.atomBeta.applySheet(ST);
  });
};
STAGES.atomBeta.frameOwn = function(st, dt, ctx, W, H){
  const R = STAGES.atomBeta.reportOf(st), I = R.isobar;
  const A = I.A;
  /* the mass parabola: only the Z worth looking at, centred on the minimum */
  /* How WIDE the window is decides whether the picture works, because the two
     features on it are on wildly different scales: the arms of an isobaric
     parabola climb by 8a_A/A per proton squared — 50 MeV within three of the
     floor at A = 32 — while the thing the panel exists to show, the 2a_P/√A gap
     between the odd–odd branch and the even–even one, is 4 MeV. Scale the axis
     to a window five protons wide and the gap is 4% of the canvas: both stable
     nuclides and the odd–odd nucleus between them draw as one flat line, which
     is the answer rendered invisible.

     Balancing the two: the arms reach c·span² and the gap is fixed, so a span
     of about A^(1/4) keeps their ratio near eight whatever the mass number,
     which is a gap of roughly a tenth of the height — small, but unmistakably
     a gap — with seven to eleven nuclides still on the plot. */
  const span = Math.max(3, Math.min(6, Math.round(Math.pow(A, 0.25)) + 1));
  /* Centred on the SMOOTH vertex, not on the mass minimum. The two differ by up
     to a proton — that is the pairing term, and it is the whole subject of the
     picture — and centring on the minimum tilts the window off the parabola, so
     one arm gets three nuclides and the other gets one. */
  const mid = Number.isFinite(I.valleyZ) ? Math.round(I.valleyZ) : I.minimumZ;
  const z0 = Math.max(1, mid - span), z1 = Math.min(A - 1, mid + span);
  const seen = I.rows.filter(r => r.Z >= z0 && r.Z <= z1);
  let top = 0;
  for(const r of seen) top = Math.max(top, r.excess);
  const hi = Math.max(4, top * 1.1);
  const pl = st.pl = mkPlot(70, 46, W - 100, H - 46 - 46, z0 - 0.6, z1 + 0.6, -hi * 0.08, hi);
  plotFrame(ctx, pl, 'proton number Z', 'mass above the valley floor (MeV)',
            'the isobaric chain at A = ' + A + ', from the mass formula alone');
  plotTicksX(ctx, pl, seen.filter(r => r.Z % 2 === 0).map(r => r.Z));
  /* the two branches, drawn apart, because the split IS the pairing term */
  for(const [pick, col, w] of [[r => r.even, TH.pos, 2], [r => r.odd, TH.neg, 2],
                               [r => !r.even && !r.odd, TH.accent, 2]]){
    const pts = seen.filter(pick);
    if(pts.length < 2) continue;
    ctx.strokeStyle = rgbCss(col, 0.75); ctx.lineWidth = w;
    ctx.beginPath();
    /* a branch that leaves the top is BROKEN, not clamped: pinning it to the
       ceiling draws a horizontal line that reads as a real prediction */
    let on = false;
    for(const r of pts){
      if(r.excess > hi){ on = false; continue; }
      const x = pl.X(r.Z), y = pl.Y(r.excess);
      if(on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; }
    }
    ctx.stroke();
  }
  for(const r of seen){
    if(r.excess > hi) continue;
    const x = pl.X(r.Z), y = pl.Y(r.excess);
    ctx.fillStyle = rgbCss(r.stable ? TH.warn : (r.even ? TH.pos : r.odd ? TH.neg : TH.accent));
    ctx.beginPath(); ctx.arc(x, y, r.stable ? 5 : 3.4, 0, 6.2832); ctx.fill();
    /* which way it goes, drawn as the decay it can do */
    if(!r.stable){
      const right = r.qm > 0;
      const nb = seen.find(q => q.Z === r.Z + (right ? 1 : -1));
      if(nb && nb.excess <= hi)
        emDrawArrow(ctx, x, y, pl.X(nb.Z), pl.Y(nb.excess), rgbCss(TH.dim, 0.7), 1.2, 6);
    }
  }
  for(const r of seen) if(r.stable)
    ctText(ctx, pl.X(r.Z), pl.Y(r.excess) - 10, ncNuclideLabel(r.Z, A),
           rgbCss(TH.warn), '700 11px ' + FONT_MONO, 'center', 'bottom');
  if(seen.length < 4)
    ctText(ctx, (pl.X(z0) + pl.X(z1)) / 2, pl.Y(hi * 0.5),
           'A = ' + A + ' has only ' + seen.length + ' isobars — name a heavier nuclide for a chain to walk',
           rgbCss(TH.faint), '600 12px ' + FONT_UI, 'center', 'middle');
  ctText(ctx, pl.X(z1 + 0.4), pl.Y(hi) + 8,
         'the decays settle at Z = ' + I.fromBelow +
         (I.fromAbove === I.fromBelow ? ' from both directions' : ' and ' + I.fromAbove) +
         ';  dB/dZ = 0 says ' + fmtNum(I.valleyZ, 4),
         rgbCss(TH.text), '600 11.5px ' + FONT_UI, 'right', 'top');
  stageNote(ctx, 'every arrow is a decay whose Q came out positive — nothing here was looked up', W, H);
};
STAGES.atomBeta.readoutOwn = function(st){
  const R = STAGES.atomBeta.reportOf(st), I = R.isobar;
  const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined there');
  return `<div class="card tight"><div class="ttl">Your nuclides, by summing masses</div>
    ${R.rows.map(r => kv(r.label + (r.q.trust === 'measured' ? '' :
        r.q.trust === 'undecided' ? ' <span style="color:var(--c-warn)">◆</span>' : ' <span style="color:var(--faint)">·</span>'),
      ncBetaVerdict(r.q) + '<br><span style="color:var(--faint)">' +
      r.q.channels.map(c => c.name + ' ' + n(c.Q, 4)).join(' · ') + ' MeV</span>')).join('')}
    <p class="help">A channel is open when its Q is positive, and Q is a difference of atomic masses:
    β⁻ and electron capture need only that, while β⁺ must also find 2m<sub>e</sub> = 1.022 MeV, which
    is why nuclides exist that can capture an electron and cannot emit a positron.</p>
    <p class="help">The marks matter. A row with <b>◆</b> has one measured binding energy and one
    modelled one, and settles nothing whichever way its sign came out — the model is wrong by several
    MeV in places and these numbers are of order one. That is not a technicality: taken at face value
    it reports ⁵⁶Fe as an electron capturer, which it is not. A row with <b>·</b> is the liquid drop's
    own opinion, self-consistent and worth what the model is worth. Only an unmarked row is a
    measurement, and on this table that means <b>³H → ³He</b>: 18.58 keV, which is the endpoint the
    KATRIN experiment exists to weigh a neutrino against.</p>
  </div>
  <div class="card tight"><div class="ttl">${R.rows[0] ? R.rows[0].label : ''} — the same Q by two arithmetics</div>
    ${(function(){
      const r = R.rows[0]; if(!r) return '';
      const c = r.q.beta.ok ? r.q.beta : r.q.ec;
      if(!c.ok) return '';
      return kv('parent mass', n(c.parent.m, 9) + ' MeV') +
        kv('daughter mass', n(c.daughter.m, 9) + ' MeV') +
        kv('Q by subtracting them', '<b>' + n(c.Q, 6) + ' MeV</b>') +
        kv('Q as (m_n − m_H) + ΔB', '<b>' + n(c.viaB, 6) + ' MeV</b>') +
        kv('difference between the routes', c.gap.toExponential(2)) +
        kv('significant figures the subtraction destroys', n(c.digits, 3)) +
        kv('binding energies came from', c.src);
    })()}
    <p class="help">The two are the same identity. Substituting M(Z, A) = Z·m<sub>H</sub> +
    (A−Z)·m<sub>n</sub> − B(Z, A) into the first makes every large term cancel <i>symbolically</i>,
    leaving a difference of binding energies plus one constant. The first route forms two numbers near
    200 GeV and subtracts them to get about one; the second never forms a large number at all. On a
    machine with fifteen digits both survive, which is exactly why the panel can print the gap and
    show you how many digits the careless route spends.</p>
  </div>
  <div class="card tight"><div class="ttl">And that constant is the neutron itself</div>
    ${kv('m_n − m_H', n(NC_QN, 8) + ' MeV')}
    ${kv('Q for a free neutron, computed', n(ncBetaQ(0, 1).beta.Q, 8) + ' MeV')}
    ${kv('difference', Math.abs(ncBetaQ(0, 1).beta.Q - NC_QN).toExponential(2))}
    <p class="help">The 0.782 MeV the panel next door treats as a given is not a separate fact. It is
    this identity with both binding energies set to zero — a free neutron and a free proton have
    nothing to unbind — so the neutron's Q value <b>is</b> the neutron–hydrogen mass difference, and
    every other β⁻ Q in the table above is that same number plus however much binding energy the
    daughter gained.</p>
  </div>
  <div class="card tight"><div class="ttl">Where the chain at A = ${I.A} settles</div>
    ${kv('following the decays up from Z = 1', 'stops at Z = ' + I.fromBelow)}
    ${kv('following them down from Z = ' + (I.A - 1), 'stops at Z = ' + I.fromAbove)}
    ${kv('the minimum of the mass itself', 'Z = ' + I.minimumZ)}
    ${kv('dB/dZ = 0, in closed form', n(I.valleyZ, 5) + (I.stable.length
      ? '   — nearest stable Z = ' + I.stable.reduce((a, z) =>
          (Math.abs(z - I.valleyZ) < Math.abs(a - I.valleyZ) ? z : a), I.stable[0]) : ''))}
    ${kv('nuclides with no open channel', I.stable.length ? I.stable.map(z => ncNuclideLabel(z, I.A)).join(', ') : 'none — every one of them can decay')}
    <p class="help">Two of these are walks: start at either end of the chain, take whichever channel
    is open, and stop when none is. The third minimises the mass outright, and only the fourth is
    algebra. ${I.fromBelow === I.fromAbove
      ? 'Here the two walks stop in the same place, and it is the mass minimum — so a single β chain reaches the bottom from either side.'
      : 'Here <b>the two walks stop in different places</b>, and that is not an error. Where the pairing term splits the parabola into an upper odd–odd branch and a lower even–even one, a nucleus can sit lower than both its neighbours without being the lowest in the chain: every single β step from it goes <i>up</i>. Reaching the true minimum would take two at once, and double β decay is exactly that — the rarest process ever observed, with half-lives beyond 10¹⁹ years. ⁷⁶Ge and ¹³⁶Xe are the real ones; the model reproduces the pattern here.'}
    The whole chain is computed from the model alone, so that no comparison along it has one measured
    end and one fitted one.</p>
  </div>`;
};
STAGES.atomBeta.chipOwn = function(st){
  const R = STAGES.atomBeta.reportOf(st), r = R.rows[0];
  if(!r) return `<div class="k">β decay</div><div>no nuclide named</div>`;
  const c = r.q.beta.ok ? r.q.beta : r.q.ec;
  return `<div class="k">${r.label}</div>
    <div>${r.q.stable ? 'no channel opens' : r.q.allowed.join(', ')}</div>
    <div style="color:var(--c-warn)">Q = ${fmtNum(c.ok ? c.Q : 0, 4)} MeV</div>`;
};
STAGES.atomBeta.legendOwn = function(){
  return [['var(--c-pos)', 'even–even nuclei — the lower branch'],
          ['var(--c-neg)', 'odd–odd nuclei — raised by the pairing term'],
          ['var(--accent)', 'odd A — one branch only'],
          ['var(--c-warn)', 'no open channel: the chain stops here'],
          ['var(--dim)', 'the decay each one can do']];
};
STAGES.atomBeta.deriveOwn = function(st){
  const R = STAGES.atomBeta.reportOf(st), I = R.isobar;
  const r = R.rows[0], c = r && (r.q.beta.ok ? r.q.beta : r.q.ec);
  const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined there');
  return {
    title:'Q from masses, and the constant that turns out to be the neutron',
    steps:[
      drvSay('the panel next door starts from a number nobody computed there',
        'Q = 0.782 MeV is written into the neutron stage as a constant, and everything downstream — the endpoint of the spectrum, the shape of the histogram, the energy the neutrino carries away — is scaled by it. Name a different nuclide and there is no constant to reach for: the question becomes whether this nucleus can decay at all, and that has to be answered from masses.'),
      drvStep('a channel is open when the masses allow it',
        `${dv('Q')}(β⁻) ${dop('=')} ${dv('M')}(${dv('Z')}, ${dv('A')}) ${dop('−')} ${dv('M')}(${dv('Z')}{+}1, ${dv('A')})`,
        c ? n(c.parent.m, 9) + ' − ' + n(c.daughter.m, 9) + ' = ' + n(c.Q, 6) + ' MeV' : ''),
      drvSay('atomic masses, not nuclear ones, and the difference matters twice',
        'Using atomic masses means the electrons cancel automatically for β⁻ and for electron capture. Positron emission is the exception: the daughter atom carries one electron fewer than the parent ion needs, so 2m_e = 1.022 MeV has to be found on top. That single term is why nuclides exist which capture an electron happily and can never emit a positron.'),
      drvStep('but that subtraction is a poor way to compute a small number',
        `${dv('M')} ${dop('≈')} 200 GeV, ${dv('Q')} ${dop('≈')} 1 MeV`,
        c ? 'about ' + n(c.digits, 3) + ' significant figures destroyed in one operation' : ''),
      drvStep('so substitute the definition and let the large terms cancel on paper',
        `${dv('M')}(${dv('Z')}, ${dv('A')}) ${dop('=')} ${dv('Z')}m_H ${dop('+')} (${dv('A')}{−}${dv('Z')})m_n ${dop('−')} ${dv('B')}(${dv('Z')}, ${dv('A')})`,
        'every term in Zm_H and (A−Z)m_n appears on both sides but one'),
      drvStep('which leaves a difference of binding energies and one constant',
        `${dv('Q')}(β⁻) ${dop('=')} (m_n ${dop('−')} m_H) ${dop('+')} [${dv('B')}(${dv('Z')}{+}1, ${dv('A')}) ${dop('−')} ${dv('B')}(${dv('Z')}, ${dv('A')})]`,
        c ? n(c.viaB, 6) + ' MeV — apart from the direct route by ' + c.gap.toExponential(2) : ''),
      drvSay('and the constant is the answer to the original question',
        'm_n − m_H = 0.78235 MeV. Set both binding energies to zero — a free neutron and a free hydrogen atom have nothing to unbind — and the general formula collapses to exactly the number the neutron stage was given. The headline figure of the panel next door is the special case of the thing you just typed, and it was never an independent fact.'),
      drvStep('where a chain of the same A settles, by walking it',
        `follow whichever channel has ${dv('Q')} ${dop('>')} 0 until none has`,
        'from Z = 1 it stops at ' + I.fromBelow + ', from Z = ' + (I.A - 1) + ' at ' + I.fromAbove +
        '; the mass minimum is Z = ' + I.minimumZ + ' and dB/dZ = 0 predicts ' + n(I.valleyZ, 4)),
      drvSay('and when the two walks stop in different places, that is the physics',
        'Where the pairing term splits the chain into an upper odd–odd branch and a lower even–even one, a nucleus can be lower than both its neighbours without being the lowest in the chain: every single β step from it goes uphill, so it cannot decay, and it is not the minimum either. Getting to the bottom would take two β decays at once. That process exists, it is the rarest ever observed — half-lives beyond 10¹⁹ years — and whether it can happen without emitting any neutrinos at all is one of the open questions of particle physics.'),
      drvSay('one warning the panel prints and means',
        'Binding energies come from AME2020 where the nuclide is in the table and from the liquid-drop model otherwise. A Q value with one measured end and one modelled end is not a compromise between them: the model is out by several MeV in places, and the quantity being decided is of order one. Such channels are labelled MIXED, and the isobaric chain is computed from the model alone so that nothing along it is compared against a different source.')
    ],
    note:'Every Q on this panel is summed from masses that are themselves assembled from binding energies, by two arithmetics that agree to machine precision and disagree completely in how much of it they spend. The chain\'s endpoint is located by three independent searches and predicted by one closed form.'
  };
};
