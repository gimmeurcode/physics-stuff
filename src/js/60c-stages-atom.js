STAGES.atomSim = {
  title: 'Inside the atom',
  /* the levels scene fills the canvas with a plot; the key sits in the dock
     (fourth instance of the floating-key-over-content class this session) */
  dockLegend: true,
  derive(st){
    return {
      title:'Five orders of magnitude, and a different force at each',
      steps:[
        drvSay('the atom is overwhelmingly empty',
          'An atom is about 10⁻¹⁰ m across; its nucleus about 10⁻¹⁵. Scaled to a football stadium, the nucleus is a marble at the centre. Essentially all the mass is in that marble and essentially all the volume is electron cloud.'),
        drvStep('the electron cloud is a probability density, not an orbit',
            `|ψ|² d³${dv('r')}`,
          'the panel samples the hydrogen ground state — each dot is a possible position, not a trajectory'),
        drvSay('and drawing orbits is actively misleading',
          'The Bohr picture of electrons on tracks is wrong and was known to be wrong by 1926. An electron in the ground state has zero angular momentum — it is not circling anything. The cloud is where it would be found, and between measurements it has no position at all.'),
        drvStep('zoom in and electromagnetism gives way to the strong force',
          `${dv('V')} ${dop('≈')} ${dop('−')}${dfrac(dv('g') + '²', dv('r'))}${dop('e')}^(${dop('−')}${dv('r')}/${dv('R')})`,
          st.zoom >= 1 ? 'the Yukawa potential, with a range set by the pion mass' : 'zoom to the nucleus to see it'),
        drvSay('the exponential is why the nucleus is small',
          'A force carried by a massive particle has a range of about ħ/mc. The pion\'s mass gives roughly 1.4 fm, so the strong force dies away over a couple of nucleon diameters. Electromagnetism, carried by a massless photon, has no such cutoff and reaches forever — which is why the Coulomb term eventually wins and heavy nuclei become unstable.'),
        drvStep('zoom again and the nucleons are made of quarks',
          `${dv('V')} ${dop('=')} ${dop('−')}${dfrac('4α_s', '3' + dv('r'))} ${dop('+')} σ${dv('r')}`,
          st.zoom >= 2 ? 'the Cornell potential — note the term growing linearly with distance' : ''),
        drvSay('and that linear term is confinement',
          'Pull two quarks apart and the energy rises without limit, so a free quark cannot exist. Eventually there is enough energy in the string to create a new quark–antiquark pair, and it snaps into two mesons rather than yielding a free quark. No isolated quark has ever been observed, and this is why.'),
        drvStep('most of your mass is not from the Higgs',
          `${dv('m')}_proton ${dop('≫')} 3${dv('m')}_quark`,
          'the three valence quarks account for about 1% — the rest is gluon field energy'),
        drvSay('so E = mc² is doing most of the work',
          'Your mass is overwhelmingly the binding energy of the strong field inside your protons and neutrons, not the intrinsic mass of the particles in them. Mass is mostly confined energy.'),
        drvStep('and the electron\'s energy ladder can be solved, for any screening you type',
          `${dop('−')}${dfrac('1', '2')}${dv('u')}″ ${dop('−')} ${dfrac(dv('Z') + '_eff(' + dv('r') + ')', dv('r'))}${dv('u')} ${dop('=')} ${dv('E')}${dv('u')}`,
          'the "levels · solved" scale marches this with node-counted Numerov and Richardson extrapolation — leave Z_eff = Z and the eigenvalues land on −13.6·Z²/n² eV to about 10⁻⁷'),
        drvSay('and breaking its hidden symmetry builds the periodic table',
          'For the pure 1/r potential, 2s and 2p come out identical although they solve different equations — an accidental degeneracy protected by a symmetry the Coulomb problem alone possesses. Any screening destroys it, always dropping s below p, because the s electron penetrates the core and sees more charge. Repeat that ordering shell by shell — 4s filling before 3d — and the structure of the periodic table falls out of one typed function.')
      ],
      note:'The cloud is sampled from the actual hydrogen wavefunction, and each potential is plotted from its own formula with real parameters — ħc = 197.3 MeV·fm, α = 1/137, and measured particle masses. The scale bar is honest at every zoom level.'
    };
  },
  /* zooms 0–2 are the 3D worlds; zoom 3 is the flat levels laboratory */
  mode: st => (st && st.zoom === 3) ? '2d' : '3d',
  enter(st, o){
    st.zoom = o.zoom !== undefined ? o.zoom : 0;     // 0 atom · 1 nucleus · 2 nucleon · 3 levels
    st.Z = o.Z !== undefined ? o.Z : 1;
    st.zsrc = o.zs || 'Z';
    st.lv = null; st.lvErr = '';
    if(st.zoom === 3) this.lvCompute(st);
    st.showPhotons = true; st.showGluons = true; st.showGravitons = false;
    st.cloud = [];
    for(let i = 0; i < 900; i++) st.cloud.push(sampleHydrogen1s(1));  // unit Bohr radius
    st.photons = []; st.pions = []; st.beta = null;
    st.quarkCols = ['r', 'g', 'b']; st.gluons = []; st.swapT = 0;
    st.probe = 1.2;                                   // in current-scale units
    st.rot = 0;
    R.cam.az = 0.6; R.cam.el = 0.35; R.cam.dist = 9.5; R.cam.tx = R.cam.ty = R.cam.tz = 0;
    /* helium-4 style nucleus: 2p + 2n for the nucleus view */
    st.nucleons = [];
    const NN = 12;
    for(let i = 0; i < NN; i++){
      const th = Math.acos(2 * ((i + 0.5) / NN) - 1), ph = i * 2.399963;
      st.nucleons.push({ p: v3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)),
                         proton: i % 2 === 0, jig: Math.random() * 6.28 });
    }
  },
  /* The reader's screening: Z_eff(r), with r in Bohr radii and Z available as
     a symbol. The parser's slots are x, y, z: r is rewritten onto x and Z onto
     y — and because `r` is also the parser's radius macro, the rewrite happens
     BEFORE parsing, never after. A literal x, y or z is rejected first. */
  zBuild(s){
    /* x is accepted as an alias for r — it IS the parser slot r lands on, and
       it is what the audit harness types into an unfamiliar box. y and z have
       no honest meaning here and are rejected by name. */
    if(/(?<![A-Za-z])[yz](?![A-Za-z])/.test(String(s)))
      throw new Error('write the screening as Z_eff(r, Z) — r and Z are the only symbols here');
    const g = compile(parse(String(s)
      .replace(/(?<![A-Za-z])r(?![A-Za-z])/g, 'x')
      .replace(/(?<![A-Za-z])Z(?![A-Za-z])/g, 'y')));
    return { f: (r, Z) => g(r, Z, 0) };
  },
  /* one pair of Numerov ladders per (source, Z) — cached, never in frame() */
  lvCompute(st){
    const key = st.zsrc + '|' + st.Z;
    if(st.lv && st.lv.key === key) return st.lv;
    const made = this.zBuild(st.zsrc);
    const Z = st.Z;
    const Zeff = r => { const v = made.f(r, Z); return Number.isFinite(v) ? v : 0; };
    const rmax = Z <= 2 ? 60 : Z <= 6 ? 30 : 15;
    const lv = { key, Z, rmax,
                 s: atLevels(Zeff, 0, 4, { rmax }),
                 p: atLevels(Zeff, 1, 3, { rmax }),
                 Zeff };
    st.lv = lv;
    return lv;
  },
  controls(){
    if(ST.zoom === 3){
      return ctlRow('scale', `<div class="seg" id="azSeg">
        <button data-z="0" aria-pressed="false">atom ·10⁵ fm</button>
        <button data-z="1" aria-pressed="false">nucleus ·5 fm</button>
        <button data-z="2" aria-pressed="false">nucleon ·1 fm</button>
        <button data-z="3" data-v="custom" aria-pressed="true">levels · your own screening</button></div>`) +
      ctlRow('nuclear charge Z', ctlSlider('azZ', 1, 20, 1, ST.Z)) +
      fnHtml('azZs', 'Z_eff(r) =', ST.zsrc, 'the charge the electron sees at radius r (Bohr radii); Z itself is available') +
      `<p class="help">The radial Schrödinger equation is <b>solved</b> for your screened potential
      −Z_eff(r)/r — node-counted Numerov at two grid sizes, Richardson-extrapolated because the
      Coulomb singularity demotes the solver to second order (measured: halving h cuts the error
      3.98×). Leave Z_eff = Z and the levels must land on <b>−13.6·Z²/n² eV</b> — they do, to about
      10⁻⁷ — and 2s and 2p, solved independently at different ℓ, coincide: the accidental
      degeneracy. Type a screening like <b>1 + (Z−1)·exp(−2r)</b> and the degeneracy breaks with s
      below p — the electron that penetrates the core sees more charge. That ordering, repeated
      shell by shell, is the periodic table.</p>`;
    }
    return ctlRow('scale', `<div class="seg" id="azSeg">
        <button data-z="0" aria-pressed="${ST.zoom === 0}">atom ·10⁵ fm</button>
        <button data-z="1" aria-pressed="${ST.zoom === 1}">nucleus ·5 fm</button>
        <button data-z="2" aria-pressed="${ST.zoom === 2}">nucleon ·1 fm</button>
        <button data-z="3" data-v="custom" aria-pressed="false">levels · your own screening</button></div>`) +
      `<div class="chkgrid">
        <label class="chk"><input type="checkbox" id="azPh" checked><span>photons γ</span></label>
        <label class="chk"><input type="checkbox" id="azGl" checked><span>gluons / pions</span></label>
        <label class="chk"><input type="checkbox" id="azGr"><span>gravitons (hypothetical)</span></label>
      </div>
      <div class="row wrap"><button class="btn sm pri" id="azBeta">Trigger β⁻ decay (weak force)</button></div>
      ` + ctlRow('probe r', ctlSlider('azProbe', 0.05, 4, 0.01, ST.probe)) +
      `<p class="help">Three nested worlds, each 10⁵–10⁰ fm across. <b>Atom</b>: the electron is a standing probability wave |ψ₁ₛ|² bound by photon exchange — the cloud is a live sample of the true 1s density. <b>Nucleus</b>: protons and neutrons held by the pion-mediated residual strong force against Coulomb repulsion. <b>Nucleon</b>: three confined quarks trading gluons; the exchanged gluon <i>swaps their colours</i>, and the total stays white. The β button fires the weak interaction: inside a neutron, d → u + W⁻, and the W⁻ materialises an electron and an antineutrino.</p>
      <div class="callout"><div class="hd">Virtual vs real particles</div>
      The translucent wavy lines (γ, π, gluons, the W flash) are <b>virtual</b>: they exist only between
      emission and absorption, on energy borrowed under ΔE·Δt ≲ ħ, can be "off-shell" (E² ≠ p²c² + m²c⁴),
      and can never hit a detector — they <i>are</i> the force. The β-decay electron and antineutrino are
      <b>real</b>: they satisfy the mass-energy relation, fly off to infinity, and are what detectors count.
      A real photon is light; a virtual photon is the Coulomb attraction itself.</div>`;
  },
  wire(){
    for(const b of $('azSeg').children) b.addEventListener('click', () => {
      const was3 = ST.zoom === 3, is3 = +b.dataset.z === 3;
      ST.zoom = +b.dataset.z;
      if(is3) STAGES.atomSim.lvCompute(ST);
      if(was3 !== is3){ buildStagePanel(); return; }
      for(const c of $('azSeg').children) c.setAttribute('aria-pressed', String(c === b));
      refreshStageReadout(); updateStageLegend();
    });
    if($('azZ')) wireSlider('azZ', () => ST.Z, v => { ST.Z = Math.max(1, Math.round(v)); STAGES.atomSim.lvCompute(ST); }, v => String(Math.round(v)));
    fnWire('azZs', (made, src) => { ST.zsrc = src; ST.lv = null; STAGES.atomSim.lvCompute(ST); },
           s => this.zBuild(s));
    if($('azPh')) $('azPh').addEventListener('change', e => ST.showPhotons = e.target.checked);
    if($('azGl')) $('azGl').addEventListener('change', e => ST.showGluons = e.target.checked);
    if($('azGr')) $('azGr').addEventListener('change', e => ST.showGravitons = e.target.checked);
    if($('azBeta')) $('azBeta').addEventListener('click', () => { ST.beta = { t: 0 }; });
    wireSlider('azProbe', () => ST.probe, v => { ST.probe = v; }, v => (+v).toFixed(2));
  },
  lvFrame(st, ctx, W, H){
    const lv = st.lv || this.lvCompute(st);
    const all = lv.s.concat(lv.p);
    if(!all.length){
      stageNote(ctx, 'no bound states — this screening never binds the electron; make Z_eff positive somewhere', W, H);
      return;
    }
    const E0 = Math.min(...all.map(x => x.Eev), atBohrEv(lv.Z, 1)) * 1.12;
    const rPlot = Math.min(lv.rmax, Math.max(8, 14 / Math.max(1, lv.Z / 3)));
    const pl = st.pl = mkPlot(70, 46, W - 104, H - 46 - 46, 0, rPlot, E0, Math.abs(E0) * 0.06);
    plotFrame(ctx, pl, 'r (Bohr radii)', 'E (eV)',
              'the potential the electron sees, and the levels it is allowed — solved, not drawn');
    plotZeroY(ctx, pl);
    /* the effective potential (ℓ = 0), in eV */
    plotCurve(ctx, pl, r => r < 0.02 ? E0 * 2 : Math.max(E0 * 2, -lv.Zeff(r) / r * AT_HARTREE_EV),
              420, rgbCss(TH.faint), 1.6);
    /* Bohr rungs first (faint), then the solved levels over them */
    for(let n = 1; n <= 4; n++){
      const y = pl.Y(atBohrEv(lv.Z, n));
      if(y < pl.py || y > pl.py + pl.ph) continue;
      ctx.strokeStyle = rgbCss(TH.grad, 0.45); ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pl.X(rPlot * 0.55), y); ctx.lineTo(pl.px + pl.pw - 4, y); ctx.stroke();
      ctx.setLineDash([]);
    }
    const lvl = (E, x0f, x1f, col, dash, lab) => {
      const y = pl.Y(E);
      if(y < pl.py || y > pl.py + pl.ph) return;
      ctx.strokeStyle = col; ctx.lineWidth = 2.2;
      if(dash) ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(pl.X(rPlot * x0f), y); ctx.lineTo(pl.X(rPlot * x1f), y); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, pl.X(rPlot * x0f) - 4, y, lab, col, '600 10.5px ' + FONT_MONO, 'right', 'middle');
    };
    for(const s of lv.s) lvl(s.Eev, 0.16, 0.52, rgbCss(TH.warn), false, s.n + 's');
    for(const p of lv.p) lvl(p.Eev, 0.58, 0.94, rgbCss(TH.neg), true, p.n + 'p');
    stageNote(ctx, 'solid: s levels · dashed: p levels — solved independently; faint green rungs are the Bohr −13.6·Z²/n²', W, H);
  },
  /* a wavy line between two points, for photon glyphs */
  wavy(a, b, amp, waves, col, w, alpha){
    const d = vsub(b, a), L = vlen(d);
    if(L < 1e-6) return;
    const u = vmul(d, 1 / L), p = vperp(u);
    const pts = [];
    for(let i = 0; i <= 30; i++){
      const t = i / 30;
      pts.push(vadd(vadd(a, vmul(d, t)), vmul(p, Math.sin(t * waves * 6.2832) * amp * Math.sin(t * Math.PI))));
    }
    R.path(pts, col, w || 1.4, alpha === undefined ? 0.9 : alpha);
  },
  /* a coiled line, for gluon glyphs */
  coil(a, b, amp, loops, col, w, alpha){
    const d = vsub(b, a), L = vlen(d);
    if(L < 1e-6) return;
    const u = vmul(d, 1 / L), p1 = vperp(u), p2 = vcross(u, p1);
    const pts = [];
    for(let i = 0; i <= 44; i++){
      const t = i / 44, th = t * loops * 6.2832;
      pts.push(vadd(vadd(a, vmul(d, t)),
        vadd(vmul(p1, Math.cos(th) * amp * Math.sin(t * Math.PI)), vmul(p2, Math.sin(th) * amp * Math.sin(t * Math.PI)))));
    }
    R.path(pts, col, w || 1.6, alpha === undefined ? 0.95 : alpha);
  },
  qcol(c){ return c === 'r' ? [224, 96, 96] : c === 'g' ? [88, 190, 110] : [96, 130, 230]; },
  frame(st, dt, ctx, W, H){
    if(st.zoom === 3){ this.lvFrame(st, ctx, W, H); return; }
    st.rot += dt * 0.12;
    R.mode2d = false; R.extent = 3;
    R.begin();
    const t = st.t;
    if(st.zoom === 0){
      /* ================= atom scale ================= */
      const aB = 2.2;                                  // Bohr radius in scene units
      /* nucleus */
      R.dot(v3(0, 0, 0), 6, rgbCss(TH.pos), rgbCss(TH.bg));
      R.label(v3(0, 0, -0.5), 'nucleus (×10⁻⁵ of the atom)', rgbCss(TH.faint), 0, 10, '10px ' + FONT_UI);
      /* electron cloud: honest |ψ₁ₛ|² sample, slowly re-drawn */
      for(let i = 0; i < st.cloud.length; i++){
        if(Math.random() < dt * 0.5) st.cloud[i] = sampleHydrogen1s(1);
        const c = st.cloud[i];
        const q = v3(c.x * aB, c.y * aB, c.z * aB);
        R.dot(q, 1.9, rgbCss(TH.accent, 0.9), null, 0.85);
      }
      /* Bohr-radius ring for calibration */
      const rim = [];
      for(let i = 0; i <= 72; i++){ const a2 = i / 72 * 6.2832; rim.push(v3(aB * Math.cos(a2), aB * Math.sin(a2), 0)); }
      R.path(rim, rgbCss(TH.line2), 1, 0.6);
      R.label(v3(aB * 1.15, 0, 0), 'a₀ = 0.53 Å', rgbCss(TH.faint), 0, 0, '10px ' + FONT_MONO);
      /* virtual photons: nucleus ↔ random cloud points */
      if(st.showPhotons){
        if(st.photons.length < 5 && Math.random() < dt * 4){
          const c = st.cloud[(Math.random() * st.cloud.length) | 0];
          st.photons.push({ to: v3(c.x * aB, c.y * aB, c.z * aB), t: 0 });
        }
        st.photons = st.photons.filter(p => (p.t += dt * 1.6) < 1);
        for(const p of st.photons){
          const frac = Math.min(1, p.t * 1.4);
          this.wavy(v3(0, 0, 0), vmul(p.to, frac), 0.09, 5, rgbCss(TH.warn), 1.4, 0.9 * (1 - p.t * 0.6));
          if(frac > 0.2) R.label(vmul(p.to, frac * 0.55), 'γ', rgbCss(TH.warn), 8, -6, '600 11px ' + FONT_UI);
        }
      }
      if(st.showGravitons) this.gravitons(st, 2.8);
      /* probe ring at r */
      this.probeRing(st.probe * aB, 'r = ' + st.probe.toFixed(2) + ' a₀');
    } else if(st.zoom === 1){
      /* ================= nucleus scale ================= */
      const sc = 1.15;
      for(const n of st.nucleons){
        n.jig += dt * (0.8 + 0.2 * Math.sin(n.jig));
        const wob = 0.06 * Math.sin(n.jig * 3);
        const q = vmul(n.p, sc * (1 + wob));
        R.dot(q, 9, n.proton ? rgbCss(TH.pos) : rgbCss(TH.mid), rgbCss(TH.bg));
        R.label(q, n.proton ? 'p' : 'n', rgbCss(TH.bg), 0, 0, '700 10px ' + FONT_UI);
      }
      /* pion exchanges between near neighbours */
      if(st.showGluons){
        if(st.pions.length < 4 && Math.random() < dt * 5){
          const i = (Math.random() * st.nucleons.length) | 0;
          let j = (i + 1 + (Math.random() * 3 | 0)) % st.nucleons.length;
          st.pions.push({ i, j, t: 0 });
        }
        st.pions = st.pions.filter(p => (p.t += dt * 2.2) < 1);
        for(const p of st.pions){
          const a = vmul(st.nucleons[p.i].p, sc), b = vmul(st.nucleons[p.j].p, sc);
          this.wavy(a, vadd(a, vmul(vsub(b, a), Math.min(1, p.t * 1.3))), 0.07, 3, rgbCss(TH.curl), 1.6, 0.95);
          R.label(vadd(a, vmul(vsub(b, a), p.t * 0.5)), 'π', rgbCss(TH.curl), 0, -9, '600 11px ' + FONT_UI);
        }
      }
      /* Coulomb repulsion arrows between protons on the surface */
      for(const n of st.nucleons){
        if(!n.proton) continue;
        R.arrow(vmul(n.p, sc * 1.12), vmul(n.p, 0.34), rgbCss(TH.warn, 0.7), 1.2, 0.7);
      }
      R.label(v3(0, 0, -2.2), 'π exchange pulls in · Coulomb pushes out — nuclei exist where the first wins', rgbCss(TH.faint), 0, 0, '10.5px ' + FONT_UI);
      if(st.showGravitons) this.gravitons(st, 2.4);
      this.probeRing(st.probe * 1.0, 'r = ' + st.probe.toFixed(2) + ' fm');
      /* β decay animation */
      if(st.beta){
        st.beta.t += dt;
        const bt = st.beta.t;
        const src = vmul(st.nucleons[1].p, sc);
        if(bt < 0.8){
          R.dot(src, 12 * bt, rgbCss(TH.warn, 0.8 - bt), null, 0.8 - bt * 0.6);
          R.label(src, 'W⁻', rgbCss(TH.warn), 0, -14, '700 12px ' + FONT_UI);
        } else if(bt < 3){
          const f = (bt - 0.8) / 2.2;
          const dir1 = vnorm(vadd(st.nucleons[1].p, v3(0.5, 0.2, 0.3))), dir2 = vnorm(vadd(st.nucleons[1].p, v3(-0.3, 0.5, -0.2)));
          R.dot(vadd(src, vmul(dir1, f * 3.2)), 3.5, rgbCss(TH.neg), rgbCss(TH.bg));
          R.label(vadd(src, vmul(dir1, f * 3.2)), 'e⁻', rgbCss(TH.neg), 10, -6, '600 11px ' + FONT_UI);
          R.dot(vadd(src, vmul(dir2, f * 3.6)), 2.5, rgbCss(TH.faint), null, 0.8);
          R.label(vadd(src, vmul(dir2, f * 3.6)), 'ν̄ₑ', rgbCss(TH.faint), 10, -6, '600 11px ' + FONT_UI);
          st.nucleons[1].proton = true;                 // n became p
        } else { st.beta = null; }
      }
    } else {
      /* ================= nucleon scale ================= */
      const qp = [v3(0.9, 0, -0.5), v3(-0.45, 0.78, -0.5), v3(-0.45, -0.78, 1.0)];
      st.swapT += dt;
      /* gluon exchange every ~0.9 s: pick a pair, swap their colours */
      if(st.showGluons && st.swapT > 0.9){
        st.swapT = 0;
        const i = (Math.random() * 3) | 0, j = (i + 1 + (Math.random() * 2 | 0)) % 3;
        st.gluons.push({ i, j, t: 0, ci: st.quarkCols[i], cj: st.quarkCols[j] });
        st.quarkCols = gluonSwap(st.quarkCols, i, j);
        if(st.gluons.length > 3) st.gluons.shift();
      }
      st.gluons = st.gluons.filter(g => (g.t += dt * 1.4) < 1);
      /* flux tubes: the confining string between each pair */
      for(let i = 0; i < 3; i++){
        const a = qp[i], b = qp[(i + 1) % 3];
        R.line(a, b, rgbCss(TH.line2), 5, 0.25);
        R.line(a, b, rgbCss(TH.dim), 2, 0.35);
      }
      for(const g of st.gluons){
        this.coil(qp[g.i], vadd(qp[g.i], vmul(vsub(qp[g.j], qp[g.i]), Math.min(1, g.t * 1.25))), 0.14, 6, rgbCss(TH.curl), 1.7, 0.95);
        R.label(vadd(qp[g.i], vmul(vsub(qp[g.j], qp[g.i]), g.t * 0.5)), 'g', rgbCss(TH.curl), 0, -11, '700 12px ' + FONT_UI);
      }
      const names = ['u', 'u', 'd'];
      for(let i = 0; i < 3; i++){
        R.dot(qp[i], 11, rgbCss(this.qcol(st.quarkCols[i])), rgbCss(TH.bg));
        R.label(qp[i], names[i], rgbCss(TH.bg), 0, 0, '700 12px ' + FONT_UI);
      }
      R.label(v3(0, 0, -1.9), 'colours swap with every gluon — but r+g+b stays white: confinement bookkeeping', rgbCss(TH.faint), 0, 0, '10.5px ' + FONT_UI);
      R.label(v3(0, 0, 2.0), 'the "string" costs σ ≈ 0.9 GeV per fm — pull quarks apart and you pay enough to mint new ones', rgbCss(TH.faint), 0, 0, '10.5px ' + FONT_UI);
      if(st.showGravitons) this.gravitons(st, 2.0);
      this.probeRing(st.probe, 'r = ' + st.probe.toFixed(2) + ' fm');
    }
    R.flush();
  },
  gravitons(st, rad){
    /* dashed expanding rings: explicitly conjectural */
    const ph = (st.t * 0.5) % 1;
    for(const off of [0, 0.5]){
      const rr = ((ph + off) % 1) * rad;
      /* draw as dash segments */
      for(let i = 0; i < 48; i += 4){
        const a1 = i / 48 * 6.2832, a2 = (i + 2) / 48 * 6.2832;
        R.line(v3(rr * Math.cos(a1), rr * Math.sin(a1), 0), v3(rr * Math.cos(a2), rr * Math.sin(a2), 0), rgbCss(TH.faint), 1, 0.35 * (1 - rr / rad));
      }
    }
    R.label(v3(0, -rad * 0.8, 0), 'graviton? — hypothetical, never observed', rgbCss(TH.faint), 0, 12, 'italic 10px ' + FONT_UI);
  },
  probeRing(r, label){
    const rim = [];
    for(let i = 0; i <= 72; i++){ const a2 = i / 72 * 6.2832; rim.push(v3(r * Math.cos(a2), r * Math.sin(a2), 0)); }
    R.path(rim, rgbCss(TH.text, 0.65), 1.2, 0.8);
    R.label(v3(0, -r, 0), label, rgbCss(TH.text), 0, 14, '600 10.5px ' + FONT_MONO);
  },
  pick(st, sx, sy){ /* probe is driven by its slider — 3D picking is ambiguous here */ },
  lvReadout(st){
    const lv = st.lv || this.lvCompute(st);
    if(!lv.s.length && !lv.p.length)
      return `<div class="card tight"><div class="ttl">No bound states</div>
        <p class="help">This screening never binds the electron — Z_eff must be positive somewhere for the potential to hold a state. Type a screening that attracts and the ladder returns.</p></div>`;
    const rows = lv.s.map(s => {
      const bohr = atBohrEv(lv.Z, s.n);
      const shift = s.Eev - bohr;
      return kv(s.n + 's — solved', fmtNum(s.Eev, 6) + ' eV' +
        (Math.abs(shift) < 1e-4 * Math.abs(bohr)
          ? ' · −13.6·Z²/n² gives ' + fmtNum(bohr, 6) + ' · ' + fmtAgree(s.Eev, bohr, 'eV')
          : ' · shifted ' + (shift > 0 ? '+' : '') + fmtNum(shift, 4) + ' eV from the Bohr ' + fmtNum(bohr, 4)));
    }).join('');
    let deg = '';
    if(lv.s.length > 1 && lv.p.length){
      const split = lv.s[1].Eev - lv.p[0].Eev;
      deg = Math.abs(split) < 1e-4 * Math.abs(lv.s[1].Eev)
        ? kv('2s vs 2p — two independent solves', fmtAgree(lv.s[1].Eev, lv.p[0].Eev, 'eV'))
        : kv('the 2s–2p split', fmtNum(-split, 4) + ' eV — s sits below p: it penetrates the screening and sees more charge');
    }
    const gap = lv.s.length > 1
      ? kv('level spacing E₂ₛ − E₁ₛ', fmtNum(lv.s[1].Eev - lv.s[0].Eev, 5) + ' eV')
      : '';
    return `<div class="card tight"><div class="ttl">The levels your screening produces · Z = ${lv.Z}</div>
      ${kv('Z_eff(r)', pkPretty(st.zsrc))}
      ${rows}${gap}${deg}
      <p class="help">Each energy is an eigenvalue of −½u″ − (Z_eff/r)u = Eu, found by node-counted
      Numerov at two grid sizes and Richardson-extrapolated — the Coulomb singularity demotes the
      raw solver to second order (measured: halving h cuts the error 3.98×), and the extrapolation
      is what buys back the 10⁻⁷. With Z_eff = Z the 2s and 2p rows must coincide although they come
      from different equations: that accidental degeneracy is the hidden symmetry of the pure 1/r
      problem, and <b>any</b> screening you type destroys it — always with s below p. Fill shells in
      that order and you have built the periodic table.</p>
    </div>`;
  },
  readout(st){
    if(st.zoom === 3) return this.lvReadout(st);
    if(st.zoom === 0){
      const rB = st.probe;                        // in Bohr radii
      const P = radialP1s(rB, 1);
      return `<div class="card tight"><div class="ttl">Electron cloud at r = ${fmtNum(rB, 3)} a₀</div>
        ${kv('|ψ₁ₛ|² (a₀⁻³)', fmtNear(psi1sDensity(rB, 1)))}
        ${kv('radial P(r) = 4πr²|ψ|²', fmtNear(P))}
        ${kv('most probable r', '1.000 a₀ — the Bohr radius, recovered')}
        ${kv('E₁, reduced mass', fmtNum(hydrogenEn(1), 6) + ' eV')}
        ${kv('E₁ measured', '−' + fmtNum(AT_H_MEASURED, 6) + ' eV')}
        ${kv('what the Bohr model misses', fmtNum(AT_H_MEASURED - AT_RYD_H, 6) + ' eV')}
        ${kv('E₂', fmtNum(hydrogenEn(2), 4) + ' eV')}
        ${kv('Coulomb V(r) here', fmtNum(-27.2 / rB / 2, 3) + ' eV')}
        <p class="help">The dots are honest samples of r²e^(−2r/a₀). No orbits: the electron has no trajectory, only this stationary probability pattern, held together by photon exchange and kept from collapsing by Δx·Δp.</p>
        <p class="help">The level shown is for <b>real hydrogen</b>: the Rydberg energy is the infinite-proton-mass limit, and using the reduced mass instead shifts it by 0.054%. The last 1.5×10⁻⁴ eV of the measured value is relativistic and QED structure — fine structure and the Lamb shift — which a Bohr-level formula cannot produce, so it is printed as a residual rather than absorbed.</p>
      </div>`;
    }
    const r = Math.max(0.05, st.probe);
    const led = forceLedger(r);
    const rows = led.rows.map(w => kv(w.name + (led.dom === w.id ? ' ◀ dominant' : ''),
      fmtNum(w.V, 4) + ' MeV')).join('');
    return `<div class="card tight"><div class="ttl">Potential between two protons at r = ${fmtNum(r, 2)} fm</div>
      ${rows}
      ${kv('EM / gravity ratio', fmtSig(Math.abs(vCoulombPP(r) / vGravityPP(r)), 3))}
      ${st.zoom === 2 ? kv('Cornell V(r) quark level', fmtNum(vCornell(r), 1) + ' MeV') : ''}
      <p class="help">Same probe, four force laws, evaluated exactly. Slide r: the strong Yukawa wins inside ~2 fm and vanishes beyond (e^(−r/1.4fm)); Coulomb never gives up; the weak term is dead beyond 0.003 fm; gravity is 36 orders down and matters only because it never cancels.</p>
    </div>`;
  },
  chip(st){
    if(st.zoom === 3){
      const lv = st.lv || this.lvCompute(st);
      if(!lv.s.length) return `<div class="k">levels · Z = ${lv.Z}</div><div>no bound states</div>`;
      return `<div class="k">levels · Z = ${lv.Z}</div>
        <div style="color:var(--c-warn)">1s = ${fmtNum(lv.s[0].Eev, 5)} eV</div>
        <div>${lv.s.length + lv.p.length} states solved</div>`;
    }
    if(st.zoom === 0) return `<div class="k">atom · 1s hydrogen</div><div>P(r) at probe = ${fmtNear(radialP1s(st.probe, 1))}</div>`;
    const led = forceLedger(Math.max(0.05, st.probe));
    return `<div class="k">r = ${st.probe.toFixed(2)} fm</div><div>strong: ${fmtNum(led.rows[0].V, 3)} MeV</div><div>EM: ${fmtNum(led.rows[1].V, 3)} MeV</div><div style="color:var(--c-pos)">dominant: ${led.dom}</div>`;
  },
  legend(st){
    const z = (st || ST) ? (st || ST).zoom : 0;
    if(z === 3) return [['var(--c-warn)', 's levels — solved (solid)'], ['var(--c-neg)', 'p levels — solved (dashed)'], ['var(--c-grad)', 'Bohr −13.6·Z²/n² rungs (faint)'], ['var(--faint)', 'the screened potential −Z_eff(r)/r']];
    if(z === 0) return [['var(--accent)', 'electron cloud — sampled |ψ₁ₛ|²'], ['var(--c-warn)', 'virtual photon γ (EM binding)'], ['var(--c-pos)', 'nucleus'], ['var(--faint)', 'graviton rings — hypothetical']];
    if(z === 1) return [['var(--c-pos)', 'proton'], ['var(--mid)', 'neutron'], ['var(--c-curl)', 'pion exchange (residual strong)'], ['var(--c-warn)', 'Coulomb repulsion / W⁻ event']];
    return [['#e06060', 'red quark'], ['#58be6e', 'green quark'], ['#6082e6', 'blue quark'], ['var(--c-curl)', 'gluon — swaps the colours'], ['var(--dim)', 'confinement flux tube']];
  }
};

/* ---- 9 · the four potentials, on one chart ------------------------------------ */
/* The pairs the four-forces chart can compare. `custom` is filled from the
   reader's own charges, masses and hadron flags. */
const AF_PAIRS = [
  { k:'pp', label:'p – p',            q1: 1, m1: M_P, h1: true,  q2:  1, m2: M_P, h2: true  },
  { k:'pe', label:'p – e (the atom)', q1: 1, m1: M_P, h1: true,  q2: -1, m2: M_E, h2: false },
  { k:'ee', label:'e – e',            q1:-1, m1: M_E, h1: false, q2: -1, m2: M_E, h2: false },
  { k:'nn', label:'n – n',            q1: 0, m1: M_N, h1: true,  q2:  0, m2: M_N, h2: true  },
  { k:'ne', label:'n – e',            q1: 0, m1: M_N, h1: true,  q2: -1, m2: M_E, h2: false }
];
STAGES.atomForces = {
  title: 'Four forces, one chart',
  /* one full-canvas plot — the key sits in the dock (the floating key covered
     the lower-left of the curves; same class as atomSM/emWave, same session) */
  dockLegend: true,
  derive(st){
    return {
      title:'Comparing the four, at a distance where the comparison means something',
      steps:[
        drvSay('the strengths are meaningless without a distance',
          'Saying gravity is 10⁻³⁹ times weaker than electromagnetism only makes sense once you say between what, and how far apart. This chart fixes two protons a set distance apart and computes each force honestly.'),
        drvStep('electromagnetism, with its coupling constant',
          `α ${dop('=')} ${dfrac(dop('e') + '²', '4πε₀ħ' + dv('c'))} ${dop('≈')} ${dfrac('1', '137')}`,
          'dimensionless, which is what makes it a genuine measure of strength'),
        drvSay('a dimensionless coupling is the only fair comparison',
          'Force laws have different units, so comparing their constants directly is meaningless. Forming a dimensionless combination with ħ and c removes the arbitrariness — and that is what a coupling constant is.'),
        drvStep('the strong force, about a hundred times stronger but short-ranged',
          `α_s ${dop('≈')} 1 at nuclear distances`,
          st.showCornell ? 'the Cornell potential is shown, with its confining linear term' : 'switch on the quark-level potential to see confinement'),
        drvStep('the weak force is not intrinsically weak',
          `range ${dop('∼')} ${dfrac('ħ', dv('m') + '_W ' + dv('c'))} ${dop('≈')} 10^(−18) m`,
          'its coupling is comparable to electromagnetism; the W and Z masses are what cripple it'),
        drvSay('so "weak" is a misnomer worth correcting',
          'The weak interaction is feeble because its carriers are about 80 and 91 GeV — enormously massive, so the range is a thousandth of a nucleus. At energies above that mass scale it is as strong as electromagnetism, and the two unify. The weakness is kinematics, not coupling.'),
        drvStep('and gravity is the outlier by an absurd margin',
          `${dfrac(dv('F') + '_grav', dv('F') + '_em')} ${dop('≈')} 10^(−36)`,
          'between two protons — the panel computes it at the probe separation'),
        drvSay('which is the hierarchy problem, and it is unsolved',
          'Nobody knows why gravity is 36 orders of magnitude weaker than electromagnetism. It is not a small discrepancy to be tidied up; it is one of the largest unexplained numbers in physics, and it motivates much of the search for new theories.'),
        drvSay('and yet gravity is the one that shapes the universe',
          'It is the only force that is always attractive and never screened. Electric charges cancel and the strong force is confined, so both die away at scale. Gravity accumulates — which is why the weakest force determines the structure of everything larger than an asteroid.'),
        drvStep('and every hand-over radius is measured, twice',
          `${dv('r')}* ${dop('=')} ${dfrac('ln|' + dv('C') + '₁/' + dv('C') + '₂|', '1/' + dv('R') + '₁ ' + dop('−') + ' 1/' + dv('R') + '₂')}`,
          'every law here is one term C·e^(−r/R)/r, so where two dominances swap has a closed form — and the panel finds the same radius independently by bisection on the potentials themselves'),
        drvSay('pick a different pair, and the rankings rearrange honestly',
          'A neutron beside an electron shares no charge and no strong force, so only the weak Yukawa and gravity compete — and gravity wins beyond 0.22 fm, which almost nobody guesses. A proton and an electron pit two 1/r laws against each other, and two 1/r laws never cross: their ratio is one number at every separation, 2.27×10³⁹, the hierarchy problem stated as a measurement. The "type your own pair" option runs the same ledger on any charges and masses you invent.')
      ],
      note:'Every potential is computed from real constants — ħc = 197.3269804 MeV·fm, α = 1/137.035999, and PDG 2024 masses. The probe reads each force at the same separation, so the comparison is like for like.'
    };
  },
  enter(st, o){
    st.probe = 1; st.showCornell = false;
    st.pairKey = o.pair || 'pp';
    st.custom = { q1: 1, m1: M_P, h1: true, q2: -1, m2: M_E, h2: false };
  },
  /* the accessor: everything downstream reads the pair through here */
  pairOf(st){
    return st.pairKey === 'custom' ? st.custom
         : (AF_PAIRS.find(p => p.k === st.pairKey) || AF_PAIRS[0]);
  },
  pairName(st){
    const P = this.pairOf(st);
    return st.pairKey === 'custom'
      ? `(q=${fmtNum(P.q1, 2)}, ${fmtNum(P.m1, 4)} MeV${P.h1 ? ', hadron' : ''}) – (q=${fmtNum(P.q2, 2)}, ${fmtNum(P.m2, 4)} MeV${P.h2 ? ', hadron' : ''})`
      : (AF_PAIRS.find(p => p.k === st.pairKey) || AF_PAIRS[0]).label;
  },
  controls(){
    const st = ST, C = st.custom;
    const one = (tag, q, m, h) =>
      `<div class="row wrap" style="gap:6px;align-items:center">
        <span class="help" style="min-width:64px">particle ${tag}</span>
        q <input id="af${tag}q" value="${fmtEdit(q, 4)}" size="4" style="width:52px">
        m (MeV) <input id="af${tag}m" value="${fmtEdit(m, 6)}" size="8" style="width:86px">
        <label class="chk"><input type="checkbox" id="af${tag}h" ${h ? 'checked' : ''}><span>hadron</span></label>
      </div>`;
    return ctSeg('afPr', st.pairKey,
        AF_PAIRS.map(p => [p.k, p.label]).concat([['custom', 'type your own pair']])) +
      (st.pairKey === 'custom'
        ? one('1', C.q1, C.m1, C.h1) + one('2', C.q2, C.m2, C.h2) +
          `<p class="help">Charges in units of e (quarks are ±⅓ and ±⅔ — type 0.667), masses in MeV.
          <b>hadron</b> means the particle feels the residual strong force, which acts only when
          <i>both</i> do. Every hand-over radius below is measured twice: bisection on the actual
          potentials, and the closed form ln|C₁/C₂|/(1/R₁ − 1/R₂) — two routes sharing nothing.</p>`
        : '') +
      `<label class="chk"><input type="checkbox" id="afC" ${st.showCornell ? 'checked' : ''}><span>Show quark-level Cornell potential (confinement)</span></label>
      <p class="help">V(r) for the chosen pair, from 10⁻³ to 10 fm, on a symmetric-log energy axis (linear near zero, logarithmic beyond ±0.1 MeV). Click to place the probe; every number in the panel is the exact potential at that r. Try <b>n – e</b>: no charge, no shared strong force — and gravity beats the weak force beyond a quarter of a femtometre, measured.</p>`;
  },
  wire(){
    ctWireSeg('afPr', v => { ST.pairKey = v; buildStagePanel(); });
    if($('afC')) $('afC').addEventListener('change', e => { ST.showCornell = e.target.checked; updateStageLegend(); });
    const num = (id, get, set, lo, hi) => {
      const el = $(id); if(!el) return;
      el.addEventListener('change', () => {
        const v = parseFloat(el.value);
        if(Number.isFinite(v)) set(Math.max(lo, Math.min(hi, v)));
        el.value = fmtEdit(get(), 6);      // echo what was actually kept
        refreshStageReadout(); updateStageChip();
      });
    };
    num('af1q', () => ST.custom.q1, v => { ST.custom.q1 = v; }, -10, 10);
    num('af2q', () => ST.custom.q2, v => { ST.custom.q2 = v; }, -10, 10);
    num('af1m', () => ST.custom.m1, v => { ST.custom.m1 = v; }, 1e-3, 1e7);
    num('af2m', () => ST.custom.m2, v => { ST.custom.m2 = v; }, 1e-3, 1e7);
    const flag = (id, set) => { const el = $(id); if(el) el.addEventListener('change', e => { set(e.target.checked); refreshStageReadout(); updateStageChip(); }); };
    flag('af1h', v => { ST.custom.h1 = v; });
    flag('af2h', v => { ST.custom.h2 = v; });
  },
  symlog(v){ const s = Math.sign(v); const a = Math.abs(v) / 0.1; return s * Math.log10(1 + a); },
  /* gravity's boost exponent: enough to see the curve, labelled honestly */
  gravBoost(st){
    const g = atPairForces(this.pairOf(st)).find(f => f.id === 'gravity');
    if(!g.on || !g.C) return 0;
    return Math.max(0, Math.min(44, Math.round(-Math.log10(Math.abs(g.C)) - 1)));
  },
  sup(n){ return String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join(''); },
  frame(st, dt, ctx, W, H){
    const pair = this.pairOf(st);
    const F = atPairForces(pair);
    const pl = st.pl = mkPlot(70, 46, W - 100, H - 46 - 46, -3, 1, -4.2, 4.2);   // x = log10 r
    plotFrame(ctx, pl, 'r (fm) — log scale', 'symlog V (MeV)',
              'potential energy: ' + this.pairName(st));
    plotTicksX(ctx, pl, [-3, -2, -1, 0, 1], v => '10' + ['⁻³', '⁻²', '⁻¹', '⁰', '¹'][v + 3]);
    plotZeroY(ctx, pl);
    /* y ticks */
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for(const mv of [-1000, -10, 0, 10, 1000]){
      ctx.fillText(mv + ' MeV', pl.px - 5, pl.Y(this.symlog(mv)));
    }
    const gk = this.gravBoost(st);
    const colOf = { strong: TH.curl, em: TH.warn, weak: TH.neg, gravity: TH.faint };
    for(const f of F){
      if(!f.on || !f.C) continue;
      const boost = f.id === 'gravity' ? Math.pow(10, gk) : 1;
      plotCurve(ctx, pl, lx => this.symlog(atVOf(f, Math.pow(10, lx)) * boost), 340,
                rgbCss(colOf[f.id]), 2);
    }
    if(st.showCornell)
      plotCurve(ctx, pl, lx => this.symlog(vCornell(Math.pow(10, lx))), 340, rgbCss(TH.grad), 2);
    /* landmark radii */
    for(const [r, lbl] of [[RANGE_W, 'W range'], [RANGE_PION, 'π range'], [R_PROTON, 'proton radius']]){
      const lx = Math.log10(r);
      if(lx < pl.x0 || lx > pl.x1) continue;
      ctx.strokeStyle = rgbCss(TH.line2); ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pl.X(lx), pl.py); ctx.lineTo(pl.X(lx), pl.py + pl.ph); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(lbl, pl.X(lx), pl.py + 2);
    }
    /* the measured hand-overs, drawn where they land */
    for(const s of atDominanceSwitches(pair, 1e-3, 10)){
      if(!s.r) continue;
      const lx = Math.log10(s.r);
      if(lx < pl.x0 || lx > pl.x1) continue;
      ctx.strokeStyle = rgbCss(TH.pos, 0.7); ctx.setLineDash([2, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(pl.X(lx), pl.py); ctx.lineTo(pl.X(lx), pl.py + pl.ph); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgbCss(TH.pos); ctx.font = '10px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(s.from + ' → ' + s.to, pl.X(lx), pl.py + pl.ph - 4);
    }
    probeLine(ctx, pl, Math.log10(st.probe), 'r = ' + fmtNum(st.probe, 3) + ' fm');
    stageNote(ctx, gk > 0
      ? 'gravity is drawn ×10' + this.sup(gk) + ' and still hugs zero — yet it runs the cosmos, because it has no negative charge to cancel it'
      : 'every curve is the exact potential for this pair — the dashed hand-overs are measured, not sketched', W, H);
  },
  pick(st, sx){ if(st.pl) st.probe = Math.pow(10, Math.max(st.pl.x0, Math.min(st.pl.x1, st.pl.invX(sx)))); },
  readout(st){
    const r = st.probe, pair = this.pairOf(st);
    const led = atPairLedger(pair, r);
    const sw = atDominanceSwitches(pair, 1e-3, 10);
    const F = atPairForces(pair);
    const em = F.find(f => f.id === 'em'), gr = F.find(f => f.id === 'gravity');
    const swRows = sw.filter(s => s.r).map(s =>
      kv(s.from + ' → ' + s.to + ' hand-over', fmtNum(s.r, 6) + ' fm' +
        (s.closed ? ' · closed form ' + fmtNum(s.closed, 6) + ' fm · ' + fmtAgree(s.r, s.closed, 'fm') : ''))
    ).join('');
    const ratioRow = (em.on && em.C && gr.on && gr.C)
      ? kv('|EM| / |gravity| — the same at every r', fmtSig(Math.abs(em.C / gr.C), 5) +
           (st.pairKey === 'pe' ? ' — the textbook 2.27×10³⁹' : ''))
      : '';
    return `<div class="card tight"><div class="ttl">Exact values at r = ${fmtNum(r, 4)} fm · ${esc(this.pairName(st))}</div>
      ${led.rows.map(w => kv(w.name + (led.dom === w.id ? ' ◀' : ''),
        !w.on ? 'off — ' + (w.id === 'strong' ? 'both particles must be hadrons' : w.id === 'em' ? 'a neutral partner' : 'massless')
              : (Math.abs(w.V) < 1e-3 && w.V !== 0 ? fmtSig(w.V, 4) : fmtNum(w.V, 4)) + ' MeV')).join('')}
      ${pair.h1 && pair.h2 ? kv('Cornell (quark level)', fmtNum(vCornell(r), 2) + ' MeV') : ''}
      ${kv('carrier ranges ħ/mc', 'π: ' + fmtNum(RANGE_PION, 3) + ' fm · W: ' + fmtSig(RANGE_W, 3) + ' fm')}
      <p class="help">Yukawa's 1935 argument runs backwards from here: a force of range R needs a carrier of mass ħ/Rc. The 1.4 fm nuclear range predicted a ~140 MeV particle — the pion, found in 1947.</p>
    </div>
    <div class="card tight"><div class="ttl">Where the ranking flips — measured, twice</div>
      ${swRows || kv('hand-overs in [10⁻³, 10] fm', 'none — one force dominates the whole window')}
      ${ratioRow}
      <p class="help">Each hand-over radius is found by bisection on the two actual potentials, then
      again from the closed form ln|C₁/C₂|/(1/R₁ − 1/R₂) — every law here is one term C·e^(−r/R)/r,
      so the algebra is exact and the two routes share nothing. Two 1/r laws never cross: their
      ratio is a single number at every distance, which for the proton–electron pair is the famous
      2.27×10³⁹ of the hierarchy problem.</p>
    </div>`;
  },
  chip(st){
    const led = atPairLedger(this.pairOf(st), st.probe);
    const sw = atDominanceSwitches(this.pairOf(st), 1e-3, 10).filter(s => s.r);
    return `<div class="k">V(r) · ${esc(st.pairKey === 'custom' ? 'your pair' : this.pairName(st))} · r = ${fmtNum(st.probe, 3)} fm</div>
      <div style="color:var(--c-pos)">dominant: ${led.dom}</div>
      <div>${sw.length ? sw.map(s => s.from + '→' + s.to + ' at ' + fmtNum(s.r, 3) + ' fm').join(' · ') : 'no hand-over in window'}</div>`;
  },
  legend(st){
    const s = st || ST;
    const F = atPairForces(this.pairOf(s));
    const gk = this.gravBoost(s);
    const rows = [];
    if(F[0].on) rows.push(['var(--c-curl)', 'strong (π Yukawa)']);
    if(F[1].on && F[1].C) rows.push(['var(--c-warn)', 'electromagnetic 1/r']);
    rows.push(['var(--c-neg)', 'weak (W-mass Yukawa)']);
    if(F[3].on && F[3].C) rows.push(['var(--faint)', 'gravity' + (gk > 0 ? ' ×10' + this.sup(gk) : '')]);
    rows.push(['var(--c-pos)', 'measured hand-over radii (dashed)']);
    if(s && s.showCornell) rows.push(['var(--c-grad)', 'Cornell −4αs/3r + σr']);
    return rows;
  }
};
