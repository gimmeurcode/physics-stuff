/* ============================================================================
   DIELECTRICS, BOUND CHARGE AND CAPACITANCE
   Syllabus gap B2 (MASTER-PLAN §3.2) — the last AP Physics 2 item the site
   computed in its engine (`esDielectric`, `ES_DIELECTRICS`, since the
   electrostatics module was written) but never showed anyone.

   The reader lists the layers filling the gap. Everything on screen follows
   from one fact — no free charge inside the dielectric, so **D is the same in
   every layer** — and three things are measured rather than asserted:

     · C by integrating E across the stack, against C from the circuit
       series law, which was written for `esSeries` years earlier and knows
       nothing about fields;
     · the bound surface charges, which TELESCOPE to exactly zero because a
       dielectric is neutral — printed against the gross they cancelled;
     · both forms of Gauss's law on the same pillbox: ∮D·dA counting free
       charge alone, ∮E·dA counting free and bound together.
   ============================================================================ */
const ED_SHEET = [
  '# thickness in mm, then κ or a material name',
  '0.4 paper',
  '0.3 4.2',
  '0.5 mica'
].join('\n');

STAGES.emDielectric = {
  title:'Dielectrics and bound charge',
  dockLegend:true,
  derive(st){
    const R = this.reportOf(st);
    const n = (v, s) => fmtNum(v, s || 5);
    return {
      title:'Why a slab of glass multiplies a capacitance',
      steps:[
        drvSay('start from what does NOT change, which is the whole trick',
          'Free charge sits only on the plates; there is none inside the dielectric. Gauss\'s law for D therefore says ∇·D = 0 in the gap, so D is the same at every depth — whatever the layers are made of and however many there are. Every other quantity here is read off that one constant.'),
        drvStep('so D is fixed by the plates alone',
          `${dv('D')} ${dop('=')} σ_free ${dop('=')} ${dfrac(dv('Q'), dv('A'))}`,
          `here D = ${fmtSig(R.F.D, 5)} C/m² across all ${R.L.length} layer${R.L.length === 1 ? '' : 's'}`),
        drvStep('and the electric field is whatever that leaves',
          `${dv('E')} ${dop('=')} ${dfrac(dv('D'), 'ε₀κ')}`,
          R.L.length ? R.F.rows.map(r => 'κ = ' + n(r.k, 4) + ' → E = ' + fmtSig(r.E, 4) + ' V/m').join(' · ') : ''),
        drvSay('the field is SMALLER inside the dielectric, and that is the point',
          'The material polarises: its molecules line up and pile opposite charge against each plate. That bound charge partly cancels the free charge, so less field survives per volt of plate charge — which means more charge can be stored at the same voltage. A dielectric does not add anything to the capacitor; it takes field away.'),
        drvStep('add the drops to get the voltage, and the capacitance follows',
          `${dv('C')} ${dop('=')} ${dfrac(dv('Q'), dv('V'))} ${dop('=')} ${dfrac('ε₀' + dv('A'), 'Σ ' + dv('d') + '_i/κ_i')}`,
          `field route: ${fmtSig(R.cField, 6)} F`),
        drvSay('and the same number comes out of circuit theory, which is not obvious',
          'Treat each layer as a capacitor in its own right, ε₀κᵢA/dᵢ, and combine them with the series law 1/C = Σ1/Cᵢ. That law was derived from charge conservation on isolated plates, with no fields in sight — yet it gives the identical answer, because "the same D everywhere" and "the same Q on every series capacitor" are the same statement. The panel prints both and their difference.'),
        drvStep('the polarisation is the part of D the field did not account for',
          `${dv('P')} ${dop('=')} ${dv('D')} ${dop('−')} ε₀${dv('E')} ${dop('=')} ${dv('D')}(1 ${dop('−')} 1/κ)`,
          'zero in vacuum, and approaching D itself for a large κ'),
        drvStep('so bound charge appears wherever P steps',
          `σ_b ${dop('=')} ${dv('P')}_1 ${dop('−')} ${dv('P')}_2`,
          R.B.faces.length ? R.B.faces.map(f => f.where + ': ' + fmtSig(f.sigma, 3) + ' C/m²').join(' · ') : ''),
        drvSay('and they must add to nothing, however many layers there are',
          'Write the faces out and the sum telescopes: −P₁ + (P₁−P₂) + (P₂−P₃) + … + P_N = 0. That is not a coincidence of these materials, it is the statement that a dielectric is electrically neutral — polarising moves charge around inside it and creates none. The panel prints the total against the gross Σ|σ_b| it cancelled out of, because a zero without its scale says nothing.'),
        drvStep('and Gauss\'s law works in both currencies',
          `∮${dv('D')} ${dop('·')} d${dv('A')} ${dop('=')} ${dv('Q')}_free , &nbsp; ∮${dv('E')} ${dop('·')} d${dv('A')} ${dop('=')} ${dfrac(dv('Q') + '_free ' + dop('+') + ' ' + dv('Q') + '_bound', 'ε₀')}`,
          `on a pillbox to depth ${n(st.probe * 1000, 3)} mm: ${fmtAgree(R.G.fluxE, R.G.qEnc, 'V·m')}`),
        drvSay('which is why D exists at all',
          'Bound charge is real charge and Gauss\'s law counts it, but you cannot know it until you have solved for the field — and you cannot solve for the field until you know the charge. Defining D = ε₀E + P absorbs the bound charge into the left-hand side, leaving a law whose source is the free charge you actually control. That is the entire reason for the second field.')
      ],
      note:'Every layer\'s field, polarisation and bound charge comes from the reader\'s own list; nothing here is stored. The capacitance is computed twice by routes with no code in common, and the neutrality of the slab is measured rather than stated.'
    };
  },
  enter(st, o){
    st.sheet = o.sheet || ED_SHEET;
    st.err = '';
    st.A = o.A !== undefined ? o.A : 0.01;      // m², 100 cm²
    st.Q = o.Q !== undefined ? o.Q : 3e-9;      // C
    st.connected = o.connected !== undefined ? !!o.connected : false;
    st.L = esStackParse(ED_SHEET).layers;
    this.applySheet(st);
    st.probe = o.probe !== undefined ? o.probe : esStackGap(st.L) * 0.55;
  },
  applySheet(st){
    const P = esStackParse(st.sheet, st.L);
    if(P.errs.length){
      st.err = P.errs.slice(0, 3).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join(' · ')
             + (P.errs.length > 3 ? ' · +' + (P.errs.length - 3) + ' more' : '');
      return;                     /* bad input never blanks the picture */
    }
    if(!P.layers.length){ st.err = 'no layers — one per line: thickness in mm, then κ or a material'; return; }
    st.err = ''; st.L = P.layers; st._r = null;
    const gap = esStackGap(st.L);
    if(!(st.probe >= 0 && st.probe <= gap)) st.probe = gap * 0.55;
  },
  reportOf(st){
    const key = st.L.map(l => l.d + ':' + l.k).join('|') + '|' + st.A + '|' + st.Q + '|' + st.probe;
    if(st._r && st._r.key === key) return st._r;
    const L = st.L, A = st.A, Q = st.Q;
    const F = esStackFields(L, A, Q);
    const r = { key, L, A, Q, F,
                gap:esStackGap(L),
                cField:esStackC(L, A),
                cSeries:esStackCSeries(L, A),
                cVac:esCapPlate(A, esStackGap(L) || 1e-9),
                B:esStackBound(L, A, Q),
                G:esStackGauss(L, A, Q, st.probe) };
    r.kEff = r.cVac > 0 ? r.cField / r.cVac : 1;
    st._r = r;
    return r;
  },
  controls(){
    const st = ST;
    return `<div class="fld" style="align-items:stretch">
      <textarea id="edSheet" rows="6" spellcheck="false" autocomplete="off"
        aria-label="dielectric layers — one per line: thickness in mm, then κ or a material name"
        data-audit="0.6 glass&#10;0.2 1&#10;0.4 water"
        style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
    </div>
    <div class="row wrap">${ctBtn('edGo', 'Rebuild the stack')}${ctBtn('edStd', 'Back to the three-layer example')}${ctBtn('edVac', 'Empty the gap')}</div>
    <p class="help" id="edMsg" style="color:${st.err ? 'var(--c-neg)' : 'var(--faint)'}">${st.err ||
      ('Stack: ' + st.L.length + ' layer' + (st.L.length === 1 ? '' : 's') + ', gap ' +
       fmtNum(esStackGap(st.L) * 1000, 4) + ' mm, effective κ = ' + fmtNum(this.reportOf(st).kEff, 5))}</p>
    <p class="help">One layer per line: <b>thickness in mm</b>, then either a number for κ or a
    material name — ${Object.keys(ES_DIELECTRICS).join(', ')}. Lines beginning # are comments.</p>` +
    ctlRow('plate area A (cm²)', ctlSlider('edA', 10, 400, 1, st.A * 1e4)) +
    ctlRow('free charge Q (nC)', ctlSlider('edQ', 0.2, 20, 0.1, st.Q * 1e9)) +
    ctlRow('pillbox depth (mm)', ctlSlider('edX', 0, Math.max(0.01, esStackGap(st.L) * 1000), 0.01, st.probe * 1000)) +
    `<p class="help">The dashed line is a Gaussian pillbox reaching from the + plate to that depth,
    and the panel reads <b>both</b> forms of Gauss's law on it. Slide it across an interface and
    watch ∮E·dA jump while ∮D·dA does not move: D never notices bound charge, which is exactly why
    it was invented. Put <b>1</b> as a κ to leave a vacuum gap between two slabs and watch the field
    jump back up there — the layers do not have to touch.</p>`;
  },
  wire(){
    const apply = () => {
      const box = $('edSheet'); if(!box) return;
      ST.sheet = box.value;
      STAGES.emDielectric.applySheet(ST);
      buildStagePanel(); refreshStageReadout(); updateStageChip();
    };
    const b = $('edSheet'); if(b) b.addEventListener('change', apply);
    const g = $('edGo'); if(g) g.addEventListener('click', apply);
    const s = $('edStd');
    if(s) s.addEventListener('click', () => {
      ST.sheet = ED_SHEET; STAGES.emDielectric.applySheet(ST);
      buildStagePanel(); refreshStageReadout(); updateStageChip();
    });
    const v = $('edVac');
    if(v) v.addEventListener('click', () => {
      ST.sheet = '# nothing but vacuum\n1.2 1'; STAGES.emDielectric.applySheet(ST);
      buildStagePanel(); refreshStageReadout(); updateStageChip();
    });
    wireSlider('edA', () => ST.A * 1e4, x => { ST.A = x * 1e-4; ST._r = null; }, x => (+x).toFixed(0));
    wireSlider('edQ', () => ST.Q * 1e9, x => { ST.Q = x * 1e-9; ST._r = null; }, x => (+x).toFixed(1));
    wireSlider('edX', () => ST.probe * 1000, x => { ST.probe = x * 1e-3; ST._r = null; }, x => (+x).toFixed(2));
  },
  frame(st, dt, ctx, W, H){
    const R = this.reportOf(st);
    const gap = R.gap;
    if(!R.L.length || !(gap > 0)){
      ctText(ctx, W / 2, H / 2, 'no layers — list one per line', rgbCss(TH.pos), '600 13px ' + FONT_UI, 'center', 'middle');
      return;
    }
    /* ---- the capacitor, drawn to scale in the top half ---- */
    const topH = Math.max(140, H * 0.46);
    const bx = 96, bw = W - 176, by = 54, bh = topH - 90;
    const xs = u => bx + (u / gap) * bw;
    /* the layers */
    let kmax = 1;
    for(const r of R.F.rows) kmax = Math.max(kmax, r.k);
    for(const r of R.F.rows){
      const t = Math.log(r.k) / Math.log(Math.max(1.0001, kmax));
      ctx.fillStyle = rgbCss(mixRGB(TH.bg3, TH.neg, 0.10 + 0.42 * t));
      ctx.fillRect(xs(r.x0), by, xs(r.x1) - xs(r.x0), bh);
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      ctx.strokeRect(xs(r.x0), by, xs(r.x1) - xs(r.x0), bh);
      const mid = (xs(r.x0) + xs(r.x1)) / 2;
      if(xs(r.x1) - xs(r.x0) > 34){
        ctText(ctx, mid, by + bh + 15, r.name, rgbCss(TH.dim), '600 10.5px ' + FONT_UI, 'center', 'top');
        ctText(ctx, mid, by + bh + 29, fmtNum(r.d * 1000, 3) + ' mm', rgbCss(TH.faint), '10px ' + FONT_UI, 'center', 'top');
      }
    }
    /* the plates */
    ctx.fillStyle = rgbCss(TH.pos);
    ctx.fillRect(xs(0) - 9, by - 8, 9, bh + 16);
    ctx.fillStyle = rgbCss(TH.neg);
    ctx.fillRect(xs(gap), by - 8, 9, bh + 16);
    /* below the plates, not above them: the readout chip floats over the
       canvas's top-left and `+Q` landed underneath it (auditticks) */
    ctText(ctx, xs(0) - 14, by + bh + 15, '+Q', rgbCss(TH.pos), '700 12px ' + FONT_UI, 'right', 'top');
    ctText(ctx, xs(gap) + 14, by + bh + 15, '−Q', rgbCss(TH.neg), '700 12px ' + FONT_UI, 'left', 'top');
    /* E arrows, scaled against the LARGEST field so the reduction is visible
       (never normalised per layer — that would draw every layer the same) */
    let emax = 1e-30;
    for(const r of R.F.rows) emax = Math.max(emax, r.E);
    for(const r of R.F.rows){
      const w = xs(r.x1) - xs(r.x0);
      const nA = Math.max(1, Math.min(6, Math.round(w / 26)));
      for(let i = 0; i < nA; i++){
        const y = by + bh * (i + 0.5) / nA;
        const len = (w - 10) * (r.E / emax);
        if(len > 3) emDrawArrow(ctx, xs(r.x0) + 5, y, xs(r.x0) + 5 + len, y, rgbCss(TH.warn, 0.92), 1.8, 8);
      }
    }
    /* bound surface charges, as signs on each face */
    for(const f of R.B.faces){
      if(Math.abs(f.sigma) < 1e-14) continue;
      const X = xs(f.x) + (f.x === 0 ? 4 : f.x >= gap ? -4 : 0);
      ctx.fillStyle = rgbCss(f.sigma > 0 ? TH.pos : TH.neg);
      for(let i = 0; i < 5; i++){
        const y = by + bh * (i + 0.5) / 5;
        ctx.beginPath(); ctx.arc(X, y, 3.4, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = rgbCss(TH.bg); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(X - 2, y); ctx.lineTo(X + 2, y);
        if(f.sigma > 0){ ctx.moveTo(X, y - 2); ctx.lineTo(X, y + 2); }
        ctx.stroke();
      }
    }
    /* the pillbox */
    const px = xs(st.probe);
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]);
    ctx.strokeRect(xs(0) - 4, by - 4, px - xs(0) + 8, bh + 8);
    ctx.setLineDash([]);
    ctText(ctx, px + 6, by - 8, 'pillbox to ' + fmtNum(st.probe * 1000, 3) + ' mm',
           rgbCss(TH.grad), '600 10.5px ' + FONT_UI, 'left', 'bottom');
    /* ---- E and P against depth, underneath ---- */
    const y1 = topH + 30;
    /* The window must cover every curve DRAWN, not just the tallest one that
       happens to be interesting: D/ε₀ = κE is up to κ times larger than E, so
       fitting to E alone put both D and P off the top and left the legend
       naming two invisible lines — the auditframe failure mode, in a stage
       whose whole point is that D is the flat one. Fit over the same list the
       drawing loop uses. */
    let vmax = emax;
    for(const r of R.F.rows) vmax = Math.max(vmax, R.F.D / ES_EPS0, r.P / ES_EPS0);
    const pl = st.pl = mkPlot(96, y1, W - 176, Math.max(70, H - y1 - 52), 0, gap * 1000, 0, vmax * 1.18);
    plotFrame(ctx, pl, 'depth (mm)', 'V/m', 'E steps down wherever κ steps up — but D never moves');
    const stepAt = (fn, col, wid) => {
      pvClip(ctx, pl, () => {
        ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.beginPath();
        let on = false;
        for(const r of R.F.rows){
          const v = fn(r);
          const X0 = pl.X(r.x0 * 1000), X1 = pl.X(r.x1 * 1000), Y = pl.Y(v);
          if(on) ctx.lineTo(X0, Y); else ctx.moveTo(X0, Y);
          ctx.lineTo(X1, Y); on = true;
        }
        ctx.stroke();
      });
    };
    stepAt(r => r.E, rgbCss(TH.warn), 2.4);
    stepAt(() => R.F.D / ES_EPS0, rgbCss(TH.neg), 1.8);
    stepAt(r => r.P / ES_EPS0, rgbCss(TH.curl), 1.8);
    pvClip(ctx, pl, () => {
      ctx.strokeStyle = rgbCss(TH.grad, 0.85); ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(pl.X(st.probe * 1000), pl.py); ctx.lineTo(pl.X(st.probe * 1000), pl.py + pl.ph); ctx.stroke();
      ctx.setLineDash([]);
    });
    stageNote(ctx, 'the arrows are the real field, drawn to one scale — a bigger κ leaves less of it', W, H);
  },
  readout(st){
    const R = this.reportOf(st);
    if(st.err)
      return `<div class="card tight"><div class="ttl">That stack did not parse</div>
        <p class="help" style="color:var(--c-neg)">${esc(st.err)}</p>
        <p class="help">The previous stack is still on screen — a bad edit never blanks the picture.</p></div>`;
    const die = esDielectric(R.cVac, R.Q / R.cVac, R.kEff, st.connected);
    return `<div class="card tight"><div class="ttl">Capacitance, by two routes that share nothing</div>
      ${kv('the stack', R.L.map(l => fmtNum(l.mm, 3) + ' mm ' + l.name).join(' · '))}
      ${kv('gap, total', fmtNum(R.gap * 1000, 5) + ' mm')}
      ${kv('C by integrating E across the gap', '<b>' + fmtSig(R.cField, 6) + ' F</b>')}
      ${kv('C by the series law on the layers', fmtSig(R.cSeries, 6) + ' F')}
      ${kv('the two routes', fmtAgree(R.cField, R.cSeries, 'F'))}
      ${kv('the same gap empty', fmtSig(R.cVac, 6) + ' F')}
      ${kv('effective κ of the whole stack', fmtNum(R.kEff, 6))}
      <p class="help">The first route integrates the field to get a voltage and divides. The second
      treats each layer as a capacitor and applies <b>1/C = Σ1/Cᵢ</b> — a law from circuit theory,
      derived from charge conservation with no field in it. They agree because "D is the same in
      every layer" and "series capacitors carry the same charge" are one statement in two
      languages, and that is worth more than either formula alone.</p>
    </div>
    <div class="card tight"><div class="ttl">The bound charge, and the zero it adds to</div>
      ${R.B.faces.map(f => kv(f.where, fmtSig(f.sigma, 4) + ' C/m²')).join('')}
      ${kv('Σ over every face × A', fmtAgreeGross(R.B.total, 0, R.B.gross, 'C'))}
      ${kv('Σ|σ_b| × A — what it cancelled out of', fmtSig(R.B.gross, 4) + ' C')}
      <p class="help">A dielectric is <b>neutral</b>: polarising it moves charge about inside and
      creates none, so the faces must cancel exactly — and they telescope,
      −P₁ + (P₁−P₂) + … + P_N = 0, whatever the layers are. The gross beside it is what that zero
      cancelled out of; without it a vanishing total would be indistinguishable from a routine that
      computed nothing, which is why the vacuum case reports both as zero and says so.</p>
    </div>
    <div class="card tight"><div class="ttl">Gauss's law at ${fmtNum(st.probe * 1000, 3)} mm, in both currencies</div>
      ${kv('∮D·dA', fmtSig(R.G.fluxD, 6) + ' C')}
      ${kv('free charge enclosed', fmtSig(R.G.qFree, 6) + ' C')}
      ${kv('D form', fmtAgree(R.G.fluxD, R.G.qFree, 'C'))}
      ${kv('∮E·dA', fmtSig(R.G.fluxE, 6) + ' V·m')}
      ${kv('(Q_free + Q_bound)/ε₀', fmtSig(R.G.qEnc, 6) + ' V·m')}
      ${kv('E form', fmtAgree(R.G.fluxE, R.G.qEnc, 'V·m'))}
      ${kv('bound charge inside the box', fmtSig(R.G.qBound, 4) + ' C — opposing the plate')}
      <p class="help">Both laws are true on the same box. The D form never changes as you slide the
      wall through the stack, because D does not see bound charge; the E form's two sides both jump
      at every interface and stay equal. That is the whole reason for defining D — it turns a law
      whose source you cannot know until you have solved the problem into one whose source is the
      charge you put on the plates.</p>
    </div>
    <div class="card tight"><div class="ttl">And what happens when you slide it in</div>
      ${kv('battery', st.connected ? 'still connected — V held fixed' : 'disconnected first — Q held fixed')}
      ${kv('energy change', fmtSig(die.dU, 4) + ' J — it ' + (die.dU > 0 ? 'rises' : 'falls'))}
      <p class="help">${die.note}</p>
      <p class="help">Either way the slab is <b>pulled in</b>, which surprises people who expect the
      two cases to disagree about that too. The fringing field at the edge acts on the bound charge,
      and its direction does not care which quantity you held fixed.</p>
    </div>`;
  },
  chip(st){
    const R = this.reportOf(st);
    return `<div class="k">dielectric stack · ${R.L.length} layer${R.L.length === 1 ? '' : 's'}</div>
      <div style="color:var(--c-warn)">C = ${fmtSig(R.cField, 4)} F</div>
      <div>κ effective = ${fmtNum(R.kEff, 4)}</div>`;
  },
  legend(){
    return [['var(--c-warn)', 'E — the real field, smaller where κ is larger'],
            ['var(--c-neg)', 'D/ε₀ — flat across every layer'],
            ['var(--c-curl)', 'P/ε₀ — the polarisation the material supplies'],
            ['var(--c-pos)', 'positive bound charge on a face'],
            ['var(--c-grad)', 'the Gaussian pillbox']];
  }
};
