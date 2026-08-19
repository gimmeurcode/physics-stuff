const SM_PARTICLES = [
  /* [row, col, symbol, name, mass, charge, spin, kind, note]
     These strings are painted straight onto the canvas by fillText, so they hold
     real Unicode — no HTML entities and no ASCII stand-ins. Nothing looks these
     rows up by symbol; the stage indexes them by position. */
  [0, 0, 'u', 'up quark',        '2.2 MeV',   '+⅔', '½', 'quark',  'In every proton (uud) and neutron (udd). Feels all four forces.'],
  [0, 1, 'c', 'charm quark',     '1.27 GeV',  '+⅔', '½', 'quark',  'Generation 2 copy of u. Predicted 1970, found 1974 (J/ψ).'],
  [0, 2, 't', 'top quark',       '172.6 GeV', '+⅔', '½', 'quark',  'Heavier than a gold atom; decays before it can hadronise.'],
  [1, 0, 'd', 'down quark',      '4.7 MeV',   '−⅓', '½', 'quark',  'Beta decay is one of these turning into u via W⁻.'],
  [1, 1, 's', 'strange quark',   '93.5 MeV',  '−⅓', '½', 'quark',  'Gave "strange" particles their long lifetimes (weak decay only).'],
  [1, 2, 'b', 'bottom quark',    '4.18 GeV',  '−⅓', '½', 'quark',  'B-meson factories study matter–antimatter asymmetry with these.'],
  [2, 0, 'e', 'electron',        '0.511 MeV', '−1', '½', 'lepton', 'Chemistry is electrons. Stable: nothing lighter carries charge.'],
  [2, 1, 'μ', 'muon',            '105.7 MeV', '−1', '½', 'lepton', 'A heavy electron, lives 2.2 μs. "Who ordered that?"'],
  [2, 2, 'τ', 'tau',             '1.777 GeV', '−1', '½', 'lepton', 'Heavy enough to decay into hadrons.'],
  /* The 0.45 eV bound is KATRIN's, and it is a limit on the effective electron-
     antineutrino mass. It is quoted for all three because oscillation fixes the
     mass-squared splittings at <~0.05 eV, so no flavour can sit far from it —
     the direct laboratory limits on mu and tau are far weaker (0.19 MeV, 18.2 MeV). */
  [3, 0, 'νe', 'e neutrino',    '< 0.45 eV', '0',  '½', 'lepton', 'Emitted in beta decay; ~10³⁸ from the sun cross Earth each second. The 0.45 eV bound is KATRIN, on this flavour.'],
  [3, 1, 'νμ', 'μ neutrino',    '< 0.45 eV', '0',  '½', 'lepton', 'Oscillates into other flavours — proof neutrinos have mass. Its own direct limit is only 0.19 MeV; the sub-eV figure follows from the tiny oscillation splittings.'],
  [3, 2, 'ντ', 'τ neutrino',    '< 0.45 eV', '0',  '½', 'lepton', 'Completes the third generation; directly detected only in 2000. Direct limit 18.2 MeV — again the sub-eV figure comes from oscillation, not from weighing it.'],
  [0, 3, 'γ', 'photon',         '0',         '0',  '1', 'boson',  'Carrier of electromagnetism. Massless: infinite range, and it IS light.'],
  [1, 3, 'g', 'gluon (×8)',     '0',         '0',  '1', 'boson',  'Carrier of the strong force; carries colour itself — hence confinement.'],
  [2, 3, 'W', 'W boson (±)',    '80.37 GeV', '±1', '1', 'boson',  'Charged weak carrier: changes quark flavour; runs beta decay and the sun.'],
  [3, 3, 'Z', 'Z boson',        '91.2 GeV',  '0',  '1', 'boson',  'Neutral weak carrier: neutrino scattering without identity change.'],
  [1.5, 4.05, 'H', 'Higgs boson', '125.2 GeV', '0', '0', 'higgs', 'Quantum of the field whose condensate gives W, Z and fermions their mass. Found 2012.'],
  [2.7, 4.05, 'G?', 'graviton',  '0 (expected)', '0', '2', 'hypo', 'Hypothetical quantum of gravity. Required by analogy, observed never.']
];
/* The anomaly lab's rep tables. A left-handed Weyl multiplet is (SU(3) rep,
   SU(2) rep, hypercharge Y); the six consistency checks are sums of products
   of these over the content, and every one is computed in EXACT integer
   arithmetic — the point of the scene is that 0 means 0, not 1e-16.
   Dynkin indices in the T(fund) = 1/2 normalisation; A is the cubic anomaly
   coefficient (A(3) = +1, A(3b) = -1, real reps 0). */
const SM_SU3_REPS = {
  '1':  { d: 1, T: { n: 0, d: 1 }, A: 0 },
  '3':  { d: 3, T: { n: 1, d: 2 }, A: 1 },
  '3b': { d: 3, T: { n: 1, d: 2 }, A: -1 },
  '8':  { d: 8, T: { n: 3, d: 1 }, A: 0 }
};
const SM_GEN_SHEET = [
  '# one generation, as left-handed Weyl multiplets',
  '# name  SU(3)  SU(2)  Y',
  'Q    3   2   1/6',
  'uc   3b  1   -2/3',
  'dc   3b  1   1/3',
  'L    1   2   -1/2',
  'ec   1   1   1'
].join('\n');
STAGES.atomSM = {
  title: 'The Standard Model',
  /* both scenes fill the canvas edge to edge — the key sits in the dock */
  dockLegend: true,
  derive(st){
    return {
      title:'Everything known, on one chart, and what is missing from it',
      steps:[
        drvSay('the most successful theory ever tested',
          'The Standard Model predicts the electron\'s magnetic moment to twelve significant figures, and experiment agrees. No laboratory measurement has ever contradicted it. It is also, on its own terms, obviously incomplete.'),
        drvStep('matter comes in three generations of the same pattern',
          `(${dv('u')}, ${dv('d')}, ${dop('e')}, ν_e) then (${dv('c')}, ${dv('s')}, μ, ν_μ) then (${dv('t')}, ${dv('b')}, τ, ν_τ)`,
          'identical charges and couplings, differing only in mass — the panel lists the measured values'),
        drvSay('nobody knows why there are three',
          'Ordinary matter needs only the first. The other two are heavier copies that decay almost immediately. Rabi\'s question on the muon\'s discovery — "who ordered that?" — has never been answered, and the count of exactly three is unexplained.'),
        drvStep('forces are carried by spin-1 bosons',
          `photon, ${dv('W')}^±, ${dv('Z')}, and eight gluons`,
          'each associated with a symmetry — the panel shows which particles each couples to'),
        drvSay('and the gauge principle is where they come from',
          'Demand that the theory be unchanged under a local phase rotation and a force carrier is forced into existence to compensate. Electromagnetism follows from a U(1) symmetry, the weak force from SU(2), the strong from SU(3). The forces are not added; they are required.'),
        drvStep('the fermion content is not a free choice — six sums must cancel',
          `${dop('Σ')} ${dv('Y')} ${dop('=')} ${dop('Σ')} ${dv('Y')}³ ${dop('=')} 0`,
          'summed over one generation of left-handed fermions with their colour and doublet multiplicities — the anomaly-cancellation conditions, and the panel computes all six in exact integer arithmetic'),
        drvSay('which is why quarks and leptons need each other',
          'Each sum is a one-loop triangle diagram that would break gauge invariance unless the charges conspire. They do — but only because quarks come in exactly three colours with hypercharge ⅙ against a charged lepton at −1. Delete one fermion from the generation and the sums miss zero; an anomalous gauge theory is not slightly wrong, it stops conserving probability. The "type your own particle content" scene runs the checks on any content you list, and because the arithmetic is over integers, a 0 there is exact and a −1 is fatal.'),
        drvStep('the Higgs field gives mass without breaking the symmetry',
          `${dv('m')} ${dop('=')} ${dv('g')}${dv('v')}`,
          'a coupling times the field\'s vacuum value — the panel shows the coupling implied by each measured mass'),
        drvSay('because the gauge principle forbids mass terms outright',
          'Writing a mass for the W and Z directly would wreck the symmetry that produced them. The Higgs mechanism hides the symmetry in the vacuum rather than removing it: the equations stay symmetric while the ground state does not. Confirmed in 2012, forty-eight years after it was proposed.'),
        drvStep('but the masses themselves are inputs, not predictions',
          `about 19 free parameters`,
          'the couplings must be measured, not derived — which is the theory\'s most obvious blemish'),
        drvSay('and four things are missing entirely',
          'Gravity is not in the model at all. Dark matter, five times more abundant than ordinary matter, has no candidate here. Neutrino masses, now measured to be nonzero, require an extension. And nothing explains why the universe has matter rather than equal antimatter. The Standard Model is right about everything it describes and silent about most of the universe.')
      ],
      note:'Every mass, charge and lifetime on the chart is from the PDG 2024 tables, and the unit tests pin them. Selecting a particle shows its measured properties rather than schematic ones.'
    };
  },
  enter(st, o){
    st.scene = o.scene || 'chart';
    st.sel = o.sel || 12; st.t = 0;  // default: the photon
    st.sheet = SM_GEN_SHEET; st.rows = []; st.sheetErr = '';
    this.applySheet(st);
  },
  /* ---- exact rational arithmetic — the sums must be 0, never 1e-16 ------- */
  rat(n, d){
    d = d || 1;
    if(d < 0){ n = -n; d = -d; }
    const g = (a, b) => b ? g(b, a % b) : a;
    const k = g(Math.abs(n), d) || 1;
    return { n: n / k, d: d / k };
  },
  radd(a, b){ return this.rat(a.n * b.d + b.n * a.d, a.d * b.d); },
  rmul(a, b){ return this.rat(a.n * b.n, a.d * b.d); },
  rscale(a, k){ return this.rat(a.n * k, a.d); },
  rfmt(r){
    if(r.n === 0) return '0';
    const s = r.n < 0 ? '−' : '';
    return r.d === 1 ? s + Math.abs(r.n) : s + Math.abs(r.n) + '/' + r.d;
  },
  /* One Weyl multiplet per line: name, SU(3) rep (1, 3, 3b, 8), SU(2) rep
     (1, 2, 3), hypercharge Y as an exact fraction. The parser never throws —
     it collects {line, msg} and a failure keeps the previous content. */
  parseSheet(text){
    const rows = [], errs = [];
    String(text).split(/\r?\n/).forEach((raw, i) => {
      const line = raw.trim();
      if(!line || line.startsWith('#')) return;
      const t = line.split(/\s+/);
      if(t.length !== 4){ errs.push({ line: i + 1, msg: 'four columns — name, SU(3), SU(2), Y' }); return; }
      const c3 = t[1].toLowerCase();
      if(!(c3 in SM_SU3_REPS)){ errs.push({ line: i + 1, msg: 'SU(3) rep must be 1, 3, 3b or 8 — got "' + t[1] + '"' }); return; }
      const d2 = +t[2];
      if(!(d2 === 1 || d2 === 2 || d2 === 3)){ errs.push({ line: i + 1, msg: 'SU(2) rep must be 1, 2 or 3' }); return; }
      const m = /^([+\-−]?)(\d+)(?:\/(\d+))?$/.exec(t[3]);
      if(!m){
        errs.push({ line: i + 1, msg: /\./.test(t[3])
          ? 'write Y as a fraction — 1/6, -2/3 — so the sums stay exact'
          : 'cannot read Y "' + t[3] + '"' });
        return;
      }
      const den = m[3] ? +m[3] : 1;
      if(!den || den > 60){ errs.push({ line: i + 1, msg: 'the Y denominator must be 1–60' }); return; }
      let num = +m[2]; if(m[1] === '-' || m[1] === '−') num = -num;
      if(Math.abs(num) > 600){ errs.push({ line: i + 1, msg: '|Y| that large means a typo' }); return; }
      rows.push({ name: t[0].slice(0, 8), c3, d3: SM_SU3_REPS[c3].d, d2, y: this.rat(num, den) });
    });
    if(rows.length > 24) errs.push({ line: 0, msg: '24 multiplets is the most the picture can hold' });
    return { rows, errs };
  },
  /* The six checks. Five are triangle sums over the multiplets; the sixth is
     Witten's global SU(2) anomaly, a parity on the doublet count. */
  sums(rows){
    let s333 = 0, doublets = 0;
    let s331 = this.rat(0), s221 = this.rat(0), s111 = this.rat(0), sgrav = this.rat(0);
    for(const r of rows){
      const rep = SM_SU3_REPS[r.c3];
      const t2 = r.d2 === 2 ? this.rat(1, 2) : r.d2 === 3 ? this.rat(2) : this.rat(0);
      s333 += r.d2 * rep.A;
      s331 = this.radd(s331, this.rscale(this.rmul(rep.T, r.y), r.d2));
      s221 = this.radd(s221, this.rscale(this.rmul(t2, r.y), rep.d));
      s111 = this.radd(s111, this.rscale(this.rmul(this.rmul(r.y, r.y), r.y), rep.d * r.d2));
      sgrav = this.radd(sgrav, this.rscale(r.y, rep.d * r.d2));
      if(r.d2 === 2) doublets += rep.d;
    }
    return { s333, s331, s221, s111, sgrav, doublets };
  },
  /* Route B for the gravitational sum: expand every multiplet into its
     components and add the ELECTRIC charge Q = T₃ + Y of each one. Equal to
     ΣY·d₃·d₂ because the T₃ of any multiplet cancel pairwise — a different
     arithmetic path to the same integer. */
  chargeSum(rows){
    let q = this.rat(0);
    for(const r of rows)
      for(let k = 0; k < r.d2; k++)
        q = this.radd(q, this.rscale(this.radd(this.rat(r.d2 - 1 - 2 * k, 2), r.y), r.d3));
    return q;
  },
  checks(an){
    return [
      { h: 'SU(3)³',    k: '[SU(3)]³ — three gluons',                    v: this.rat(an.s333) },
      { h: 'SU(3)²·Y',  k: '[SU(3)]²·U(1) — two gluons, one hypercharge', v: an.s331 },
      { h: 'SU(2)²·Y',  k: '[SU(2)]²·U(1) — two W’s, one hypercharge', v: an.s221 },
      { h: 'Y³',        k: '[U(1)]³ — three hypercharges',               v: an.s111 },
      { h: 'grav²·Y',   k: 'grav²·U(1) — two gravitons, one hypercharge', v: an.sgrav }
    ].map(c => (c.zero = c.v.n === 0, c));
  },
  failCount(st){
    return this.checks(st.an).filter(c => !c.zero).length + (st.an.doublets % 2 ? 1 : 0);
  },
  applySheet(st){
    const P = this.parseSheet(st.sheet);
    if(P.errs.length){
      st.sheetErr = P.errs.slice(0, 3).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join(' · ')
        + (P.errs.length > 3 ? ' · +' + (P.errs.length - 3) + ' more' : '');
      return;  // previous content kept — bad input never blanks the picture
    }
    if(!P.rows.length){ st.sheetErr = 'no multiplets — one per line: name, SU(3), SU(2), Y'; return; }
    st.sheetErr = '';
    st.rows = P.rows;
    st.an = this.sums(P.rows);
    st.qsum = this.chargeSum(P.rows);
  },
  controls(){
    const st = ST;
    return ctSeg('asmSc', st.scene, [['chart', 'the particle chart'], ['own', 'type your own particle content']]) +
      (st.scene === 'own'
        ? `<div class="fld" style="align-items:stretch">
    <textarea id="asmSheet" rows="8" spellcheck="false" autocomplete="off"
      aria-label="particle content — one Weyl multiplet per line: name, SU(3) rep, SU(2) rep, hypercharge"
      data-audit="Q 3 2 1/6&#10;uc 3b 1 -2/3&#10;dc 3b 1 1/3&#10;L 1 2 -1/2"
      style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
  </div>
  <div class="row wrap">${ctBtn('asmGo', 'Check it')}${ctBtn('asmStd', 'Back to one SM generation')}</div>
  <p class="help" id="asmMsg" style="color:${st.sheetErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.sheetErr ||
    'One left-handed Weyl multiplet per line: <b>name</b>, <b>SU(3)</b> rep (1, 3, 3b or 8 — 3b is the antitriplet), <b>SU(2)</b> rep (1, 2 or 3), and <b>hypercharge Y</b> as an exact fraction. Lines starting with # are comments.'}</p>
  <p class="help">A gauge theory with an anomaly is not inaccurate, it is <b>inconsistent</b> — a triangle diagram with three gauge legs breaks the gauge symmetry at one loop and probability stops being conserved. Six sums over the fermion content must land exactly on zero, and here they are computed in <b>integer arithmetic</b> on whatever you type, so a 0 is a 0. <b>Delete the ec line</b> and two checks print −1 at once; put it back and every staircase lands on zero again.</p>`
        : `<p class="help">Every matter particle (fermion, spin 1/2) and every force carrier (boson) we know of - drawn to one map. <b>Click any tile</b> to load its data into the probe panel. Columns 1-3 are the three fermion generations (identical charges, wildly different masses); column 4 is the gauge bosons; offset: the Higgs and the hypothetical graviton. Antiparticles double the fermion count with all charges flipped.</p>`);
  },
  wire(){
    ctWireSeg('asmSc', v => { ST.scene = v; buildStagePanel(); });
    const apply = () => {
      const box = $('asmSheet'); if(!box) return;
      ST.sheet = box.value;
      STAGES.atomSM.applySheet(ST);
      const msg = $('asmMsg');
      if(msg){
        const fails = STAGES.atomSM.failCount(ST);
        msg.innerHTML = ST.sheetErr || (ST.rows.length + ' multiplets, ' +
          ST.rows.reduce((a, r) => a + r.d3 * r.d2, 0) + ' Weyl fermions — ' +
          (fails ? fails + ' of 6 checks fail' : 'all 6 checks cancel exactly'));
        msg.style.color = ST.sheetErr ? 'var(--c-neg)' : 'var(--faint)';
      }
      refreshStageReadout(); updateStageChip();
    };
    const b = $('asmSheet'); if(b) b.addEventListener('change', apply);
    const g = $('asmGo'); if(g) g.addEventListener('click', apply);
    const s = $('asmStd');
    if(s) s.addEventListener('click', () => {
      ST.sheet = SM_GEN_SHEET;
      STAGES.atomSM.applySheet(ST);
      buildStagePanel(); refreshStageReadout(); updateStageChip();
    });
  },
  tile(st, W, H, p){
    const [row, col] = p;
    const cw = Math.min(168, (W - 80) / 5.4), ch = Math.min(124, (H - 120) / 4.35);
    const x0 = (W - cw * 5.35) / 2 + col * cw * 1.07;
    const y0 = 74 + row * ch * 1.09;
    return { x: x0, y: y0, w: cw, h: ch };
  },
  kindCol(kind){
    return kind === 'quark' ? TH.curl : kind === 'lepton' ? TH.grad
         : kind === 'boson' ? TH.warn : kind === 'higgs' ? TH.pos : TH.faint;
  },
  /* float value of one multiplet's contribution to check ci — geometry only;
     the numbers the panels print come from the exact sums */
  contribOf(r, ci){
    const rep = SM_SU3_REPS[r.c3], yf = r.y.n / r.y.d;
    const t2 = r.d2 === 2 ? 0.5 : r.d2 === 3 ? 2 : 0;
    const t3 = rep.T.n / rep.T.d;
    return ci === 0 ? r.d2 * rep.A
         : ci === 1 ? r.d2 * t3 * yf
         : ci === 2 ? rep.d * t2 * yf
         : ci === 3 ? rep.d * r.d2 * yf * yf * yf
         : rep.d * r.d2 * yf;
  },
  frameOwn(st, ctx, W, H){
    st.tiles = [];
    const C = this.checks(st.an), rows = st.rows, n = rows.length;
    const x0 = 30, x1 = W - 18;
    const yTop = 104, yBot = Math.max(yTop + 60, H - 92);
    const colW = (x1 - x0) / C.length;
    for(let ci = 0; ci < C.length; ci++){
      const cx = x0 + ci * colW;
      const contrib = rows.map(r => this.contribOf(r, ci));
      const run = [0];
      for(const v of contrib) run.push(run[run.length - 1] + v);
      let m = 0; for(const v of run) m = Math.max(m, Math.abs(v));
      if(m < 1e-12) m = 1;
      const y0 = (yTop + yBot) / 2;
      const s = (yBot - yTop) / 2 / m * 0.92;
      ctx.strokeStyle = rgbCss(TH.faint, 0.5); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cx + 4, y0); ctx.lineTo(cx + colW - 14, y0); ctx.stroke();
      ctx.setLineDash([]);
      const bw = Math.min(20, (colW - 36) / Math.max(1, n));
      let px = 0, py = 0;
      for(let i = 0; i < n; i++){
        const xa = cx + 8 + i * bw + bw / 2;
        const ya = y0 - run[i] * s, yb = y0 - run[i + 1] * s;
        const col = rows[i].d3 > 1 ? TH.curl : TH.neg;
        if(i){
          ctx.strokeStyle = rgbCss(TH.faint, 0.55); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(xa, ya); ctx.stroke();
        }
        if(Math.abs(contrib[i]) < 1e-12){
          ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(xa - bw * 0.3, ya); ctx.lineTo(xa + bw * 0.3, ya); ctx.stroke();
        } else {
          ctx.strokeStyle = rgbCss(col, 0.95); ctx.lineWidth = Math.max(3, bw * 0.4);
          ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, yb); ctx.stroke();
        }
        if(ci === 0 && n <= 9)
          ctText(ctx, xa, Math.min(ya, yb) - 6, rows[i].name, rgbCss(TH.dim), '10px ' + FONT_UI, 'center', 'bottom');
        px = xa; py = yb;
      }
      const yn = y0 - run[n] * s;
      ctx.fillStyle = rgbCss(C[ci].zero ? TH.grad : TH.pos);
      ctx.beginPath(); ctx.arc(cx + 8 + n * bw + 5, yn, 3.5, 0, 2 * Math.PI); ctx.fill();
      ctText(ctx, cx + (colW - 14) / 2, yBot + 14, C[ci].h, rgbCss(TH.dim), '600 11px ' + FONT_UI, 'center', 'top');
      ctText(ctx, cx + (colW - 14) / 2, yBot + 30, C[ci].zero ? '= 0' : '= ' + this.rfmt(C[ci].v),
             rgbCss(C[ci].zero ? TH.grad : TH.pos), '700 12px ' + FONT_MONO, 'center', 'top');
    }
    const even = st.an.doublets % 2 === 0;
    ctText(ctx, W / 2, yBot + 50, 'SU(2) doublets: ' + st.an.doublets +
           (even ? ' — even: the Witten check passes' : ' — odd: Witten anomaly, inconsistent'),
           rgbCss(even ? TH.dim : TH.pos), '11px ' + FONT_UI, 'center', 'top');
    stageNote(ctx, 'five staircases, one per triangle — each multiplet is a step, and a consistent theory lands every one on zero', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.scene === 'own'){ this.frameOwn(st, ctx, W, H); return; }
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 13px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('FERMIONS - matter (spin 1/2, obey Pauli)', (W - 150) / 2 - 60, 22);
    {
      /* keep the heading clear of the fps strip floating over the top-right —
         at 1280 wide it printed straight through it (2026-08-19 sweep) */
      const bx = W / 2 + Math.min(150, (W - 80) / 5.4) * 1.7;
      const pz = ctPerfZone(ctx), bw = ctx.measureText('BOSONS - forces').width;
      ctx.fillText('BOSONS - forces', pz.h > 0 ? Math.min(bx, pz.x - 8 - bw / 2) : bx, 22);
    }
    ctx.font = '10.5px ' + FONT_UI; ctx.fillStyle = rgbCss(TH.faint);
    ctx.fillText('generation:   1              2              3', (W - 150) / 2 - 60, 44);
    st.tiles = [];
    SM_PARTICLES.forEach((p, i) => {
      const T = this.tile(st, W, H, p);
      st.tiles.push(T);
      const col = this.kindCol(p[7]);
      const selected = i === st.sel;
      ctx.fillStyle = rgbCss(mixRGB(TH.bg3, hexRGB(rgbCss(col)), selected ? 0.3 : 0.10));
      ctx.strokeStyle = rgbCss(col, selected ? 1 : 0.45);
      ctx.lineWidth = selected ? 2.2 : 1.1;
      const rr2 = 8;
      ctx.beginPath();
      ctx.moveTo(T.x + rr2, T.y);
      ctx.arcTo(T.x + T.w, T.y, T.x + T.w, T.y + T.h, rr2);
      ctx.arcTo(T.x + T.w, T.y + T.h, T.x, T.y + T.h, rr2);
      ctx.arcTo(T.x, T.y + T.h, T.x, T.y, rr2);
      ctx.arcTo(T.x, T.y, T.x + T.w, T.y, rr2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if(p[7] === 'hypo'){ ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = rgbCss(col);
      ctx.font = '700 ' + Math.min(26, T.h * 0.32) + 'px ' + FONT_UI; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(p[2], T.x + 10, T.y + 7);
      ctx.fillStyle = rgbCss(TH.text);
      ctx.font = '600 11px ' + FONT_UI;
      ctx.fillText(p[3], T.x + 10, T.y + T.h * 0.42);
      ctx.fillStyle = rgbCss(TH.dim); ctx.font = '11px ' + FONT_MONO;
      ctx.fillText(p[4], T.x + 10, T.y + T.h * 0.60);
      ctx.fillStyle = rgbCss(TH.faint);
      ctx.fillText('q = ' + p[5] + '   spin ' + p[6], T.x + 10, T.y + T.h * 0.78);
    });
    const sel = SM_PARTICLES[st.sel];
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '11.5px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(sel[3] + ' - ' + sel[8], W / 2, H - 12);
  },
  pick(st, sx, sy){
    if(st.scene !== 'chart' || !st.tiles) return;
    for(let i = 0; i < st.tiles.length; i++){
      const T = st.tiles[i];
      if(sx >= T.x && sx <= T.x + T.w && sy >= T.y && sy <= T.y + T.h){ st.sel = i; break; }
    }
  },
  readoutOwn(st){
    const an = st.an, C = this.checks(an);
    const nf = st.rows.reduce((a, r) => a + r.d3 * r.d2, 0);
    const fails = this.failCount(st);
    const even = an.doublets % 2 === 0;
    return `<div class="card tight"><div class="ttl">Six consistency checks, in exact integer arithmetic</div>
      ${C.map(c => kv(c.k, c.zero ? '0 — cancels' : this.rfmt(c.v) + ' — does not cancel')).join('')}
      ${kv('SU(2) doublets (Witten)', an.doublets + (even ? ' — even: consistent' : ' — odd: inconsistent'))}
      <p class="help">${fails === 0
        ? 'All six cancel. Every sum is computed over your ' + st.rows.length + ' multiplets (' + nf + ' Weyl fermions) in <b>integer arithmetic</b> — a 0 here is exact, not 10<sup>−16</sup>. Each of the five sums is a one-loop triangle diagram with three gauge legs; if any missed zero, gauge invariance would fail at one loop and the theory would stop conserving probability. The sixth is Witten\'s global anomaly: an odd number of SU(2) doublets makes the path integral change sign under a large gauge transformation, so it cancels itself.'
        : fails + ' of 6 fail. An anomalous gauge theory is not a theory with an error term — it is <b>inconsistent</b>: the symmetry that defines it dies at one loop and probability stops being conserved. The number printed beside each failed check is exact; no amount of parameter tuning removes it. Only changing the <i>content</i> can.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The gravitational sum, by two routes</div>
      ${kv('ΣY·d₃·d₂, multiplet by multiplet', this.rfmt(an.sgrav))}
      ${kv('ΣQ over the ' + nf + ' component fermions', this.rfmt(st.qsum))}
      ${kv('the two routes', 'equal to every digit — integer arithmetic, no tolerance')}
      <p class="help">The second route expands every multiplet into components and adds the <b>electric</b> charge Q = T₃ + Y of each one. It must equal the first because the T₃ values of any multiplet cancel in pairs — a different arithmetic path to the same number. For one SM generation both give 0: the electric charges of a generation sum to zero, which is why the proton\'s charge is exactly minus the electron\'s.</p>
    </div>
    <div class="card tight"><div class="ttl">Things worth trying</div>
      <p class="help"><b>Delete the ec line</b>: [U(1)]³ and grav²·U(1) both print exactly −1 — the sums that can see a colour-and-SU(2) singlet are the ones that die. <b>Add nc 1 1 0</b> — a right-handed neutrino: nothing moves, every sum is blind to it, which is part of why it is so hard to detect. <b>Change Q\'s hypercharge to 1/5</b>: the four hypercharge sums fail at once (only the pure-gluon triangle and the Witten count cannot see Y) — the hypercharges of the Standard Model are rigid, not chosen.</p>
    </div>`;
  },
  readout(st){
    if(st.scene === 'own') return this.readoutOwn(st);
    const p = SM_PARTICLES[st.sel];
    const forces = p[7] === 'quark' ? 'strong, EM, weak, gravity'
      : p[2].startsWith('nu') ? 'weak, gravity only - hence "ghost particles"'
      : p[7] === 'lepton' ? 'EM, weak, gravity'
      : p[7] === 'boson' ? 'is a force' : p[7] === 'higgs' ? 'gives mass; couples by mass' : 'would be gravity itself';
    return `<div class="card tight"><div class="ttl">${p[3]} (${p[2]})</div>
      ${kv('mass', p[4])}
      ${kv('electric charge', p[5] + ' e')}
      ${kv('spin', p[6] + ' ħ — ' + (p[6] === '½' ? 'fermion: antisymmetric Ψ, obeys Pauli' : p[6] === '0' ? 'scalar boson' : 'boson: symmetric Ψ, can pile up'))}
      ${kv('feels / mediates', forces)}
      <p class="help">${p[8]}</p>
    </div>
    <div class="card tight"><div class="ttl">Reading the map</div>
      <p class="help">All stable matter is the first column: u, d, e (and the ghostly ν<sub>e</sub>). Generations 2 and 3 are heavier photocopies that decay back — their role in nature's design is still an open question. The spin column is the deepest divide: half-integer spin means antisymmetric wavefunctions, exclusion, shells and solidity (see the Pauli stage); integer spin means bosons can occupy one state en masse — which is what a laser beam and a force field are.</p>
    </div>`;
  },
  chip(st){
    if(st.scene === 'own'){
      const fails = this.failCount(st);
      const nf = st.rows.reduce((a, r) => a + r.d3 * r.d2, 0);
      return `<div class="k">anomaly cancellation</div><div>${st.rows.length} multiplets · ${nf} Weyl fermions</div>
        <div style="color:${fails ? 'var(--c-pos)' : 'var(--c-grad)'}">${fails ? fails + ' of 6 checks fail' : '6 of 6 sums land on 0'}</div>`;
    }
    const p = SM_PARTICLES[st.sel];
    return `<div class="k">Standard Model</div><div>${p[3]}</div><div>m = ${p[4]} · spin ${p[6]}</div>`;
  },
  legend(st){
    return st.scene === 'own'
      ? [['var(--c-curl)', 'colour-charged multiplets (quarks)'], ['var(--c-neg)', 'colour singlets (leptons)'],
         ['var(--c-grad)', 'a sum landing on zero'], ['var(--c-pos)', 'a sum that misses — anomalous']]
      : [['var(--c-curl)', 'quarks — feel the strong force'], ['var(--c-grad)', 'leptons'], ['var(--c-warn)', 'gauge bosons — the forces'], ['var(--c-pos)', 'Higgs'], ['var(--faint)', 'graviton — hypothetical (dashed)']];
  }
};

/* ---- 15 · relativity: the frame decides what is electric and what is magnetic ---- */
/* The EXACT field of a charge in uniform motion (a textbook solution of Maxwell,
   or equivalently the Coulomb field Lorentz-boosted):
     E(r, theta) = q(1-beta^2) r_hat / [r^2 (1 - beta^2 sin^2 theta)^(3/2)]
     B = beta x E   (c = 1)
   theta measured from the velocity. At beta = 0 this IS Coulomb; as beta -> 1 the
   field pancakes into the transverse plane and a magnetic field appears from
   nothing but a change of viewpoint. */
