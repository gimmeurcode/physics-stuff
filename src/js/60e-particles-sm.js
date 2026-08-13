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
STAGES.atomSM = {
  title: 'The Standard Model',
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
  enter(st, o){ st.sel = o.sel || 12; st.t = 0; },  // default: the photon
  controls(){
    return `<p class="help">Every matter particle (fermion, spin 1/2) and every force carrier (boson) we know of - drawn to one map. <b>Click any tile</b> to load its data into the probe panel. Columns 1-3 are the three fermion generations (identical charges, wildly different masses); column 4 is the gauge bosons; offset: the Higgs and the hypothetical graviton. Antiparticles double the fermion count with all charges flipped.</p>`;
  },
  wire(){},
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
  frame(st, dt, ctx, W, H){
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 13px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('FERMIONS - matter (spin 1/2, obey Pauli)', (W - 150) / 2 - 60, 22);
    ctx.fillText('BOSONS - forces', W / 2 + Math.min(150, (W - 80) / 5.4) * 1.7, 22);
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
    if(!st.tiles) return;
    for(let i = 0; i < st.tiles.length; i++){
      const T = st.tiles[i];
      if(sx >= T.x && sx <= T.x + T.w && sy >= T.y && sy <= T.y + T.h){ st.sel = i; break; }
    }
  },
  readout(st){
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
    const p = SM_PARTICLES[st.sel];
    return `<div class="k">Standard Model</div><div>${p[3]}</div><div>m = ${p[4]} · spin ${p[6]}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'quarks — feel the strong force'], ['var(--c-grad)', 'leptons'], ['var(--c-warn)', 'gauge bosons — the forces'], ['var(--c-pos)', 'Higgs'], ['var(--faint)', 'graviton — hypothetical (dashed)']]; }
};

/* ---- 15 · relativity: the frame decides what is electric and what is magnetic ---- */
/* The EXACT field of a charge in uniform motion (a textbook solution of Maxwell,
   or equivalently the Coulomb field Lorentz-boosted):
     E(r, theta) = q(1-beta^2) r_hat / [r^2 (1 - beta^2 sin^2 theta)^(3/2)]
     B = beta x E   (c = 1)
   theta measured from the velocity. At beta = 0 this IS Coulomb; as beta -> 1 the
   field pancakes into the transverse plane and a magnetic field appears from
   nothing but a change of viewpoint. */
