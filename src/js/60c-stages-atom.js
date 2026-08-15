STAGES.atomSim = {
  title: 'Inside the atom',
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
          'Your mass is overwhelmingly the binding energy of the strong field inside your protons and neutrons, not the intrinsic mass of the particles in them. Mass is mostly confined energy.')
      ],
      note:'The cloud is sampled from the actual hydrogen wavefunction, and each potential is plotted from its own formula with real parameters — ħc = 197.3 MeV·fm, α = 1/137, and measured particle masses. The scale bar is honest at every zoom level.'
    };
  },
  mode: '3d',
  enter(st, o){
    st.zoom = o.zoom !== undefined ? o.zoom : 0;     // 0 atom · 1 nucleus · 2 nucleon
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
  controls(){
    return ctlRow('scale', `<div class="seg" id="azSeg">
        <button data-z="0" aria-pressed="${ST.zoom === 0}">atom ·10⁵ fm</button>
        <button data-z="1" aria-pressed="${ST.zoom === 1}">nucleus ·5 fm</button>
        <button data-z="2" aria-pressed="${ST.zoom === 2}">nucleon ·1 fm</button></div>`) +
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
      ST.zoom = +b.dataset.z;
      for(const c of $('azSeg').children) c.setAttribute('aria-pressed', String(c === b));
      refreshStageReadout(); updateStageLegend();
    });
    $('azPh').addEventListener('change', e => ST.showPhotons = e.target.checked);
    $('azGl').addEventListener('change', e => ST.showGluons = e.target.checked);
    $('azGr').addEventListener('change', e => ST.showGravitons = e.target.checked);
    $('azBeta').addEventListener('click', () => { ST.beta = { t: 0 }; });
    wireSlider('azProbe', () => ST.probe, v => { ST.probe = v; }, v => (+v).toFixed(2));
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
  readout(st){
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
    if(st.zoom === 0) return `<div class="k">atom · 1s hydrogen</div><div>P(r) at probe = ${fmtNear(radialP1s(st.probe, 1))}</div>`;
    const led = forceLedger(Math.max(0.05, st.probe));
    return `<div class="k">r = ${st.probe.toFixed(2)} fm</div><div>strong: ${fmtNum(led.rows[0].V, 3)} MeV</div><div>EM: ${fmtNum(led.rows[1].V, 3)} MeV</div><div style="color:var(--c-pos)">dominant: ${led.dom}</div>`;
  },
  legend(){
    const z = ST ? ST.zoom : 0;
    if(z === 0) return [['var(--accent)', 'electron cloud — sampled |ψ₁ₛ|²'], ['var(--c-warn)', 'virtual photon γ (EM binding)'], ['var(--c-pos)', 'nucleus'], ['var(--faint)', 'graviton rings — hypothetical']];
    if(z === 1) return [['var(--c-pos)', 'proton'], ['var(--mid)', 'neutron'], ['var(--c-curl)', 'pion exchange (residual strong)'], ['var(--c-warn)', 'Coulomb repulsion / W⁻ event']];
    return [['#e06060', 'red quark'], ['#58be6e', 'green quark'], ['#6082e6', 'blue quark'], ['var(--c-curl)', 'gluon — swaps the colours'], ['var(--dim)', 'confinement flux tube']];
  }
};

/* ---- 9 · the four potentials, on one chart ------------------------------------ */
STAGES.atomForces = {
  title: 'Four forces, one chart',
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
          'It is the only force that is always attractive and never screened. Electric charges cancel and the strong force is confined, so both die away at scale. Gravity accumulates — which is why the weakest force determines the structure of everything larger than an asteroid.')
      ],
      note:'Every potential is computed from real constants — ħc = 197.3269804 MeV·fm, α = 1/137.035999, and PDG 2024 masses. The probe reads each force at the same separation, so the comparison is like for like.'
    };
  },
  enter(st, o){ st.probe = 1; st.showCornell = false; },
  controls(){
    return `<label class="chk"><input type="checkbox" id="afC"><span>Show quark-level Cornell potential (confinement)</span></label>
      <p class="help">V(r) between two protons, from 10⁻³ to 10 fm, on a symmetric-log energy axis (linear near zero, logarithmic beyond ±0.1 MeV). Click to place the probe; every number in the panel is the exact potential at that r.</p>`;
  },
  wire(){ $('afC').addEventListener('change', e => { ST.showCornell = e.target.checked; updateStageLegend(); }); },
  symlog(v){ const s = Math.sign(v); const a = Math.abs(v) / 0.1; return s * Math.log10(1 + a); },
  frame(st, dt, ctx, W, H){
    const pl = st.pl = mkPlot(70, 46, W - 100, H - 46 - 46, -3, 1, -4.2, 4.2);   // x = log10 r
    plotFrame(ctx, pl, 'r (fm) — log scale', 'symlog V (MeV)', 'potential energy between two protons');
    plotTicksX(ctx, pl, [-3, -2, -1, 0, 1], v => '10' + ['⁻³', '⁻²', '⁻¹', '⁰', '¹'][v + 3]);
    plotZeroY(ctx, pl);
    /* y ticks */
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for(const mv of [-1000, -10, 0, 10, 1000]){
      ctx.fillText(mv + ' MeV', pl.px - 5, pl.Y(this.symlog(mv)));
    }
    const curves = [
      [r => vYukawaNN(r), TH.curl, 'strong'],
      [r => vCoulombPP(r), TH.warn, 'EM'],
      [r => vWeak(r), TH.neg, 'weak'],
      [r => vGravityPP(r) * 1e34, TH.faint, 'gravity ×10³⁴']
    ];
    if(st.showCornell) curves.push([r => vCornell(r), TH.grad, 'Cornell (quarks)']);
    for(const [fn, col, name] of curves){
      plotCurve(ctx, pl, lx => this.symlog(fn(Math.pow(10, lx))), 340, rgbCss(col), 2);
    }
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
    probeLine(ctx, pl, Math.log10(st.probe), 'r = ' + fmtNum(st.probe, 3) + ' fm');
    stageNote(ctx, 'gravity is drawn ×10³⁴ and still hugs zero — yet it runs the cosmos, because it has no negative charge to cancel it', W, H);
  },
  pick(st, sx){ if(st.pl) st.probe = Math.pow(10, Math.max(st.pl.x0, Math.min(st.pl.x1, st.pl.invX(sx)))); },
  readout(st){
    const r = st.probe, led = forceLedger(r);
    return `<div class="card tight"><div class="ttl">Exact values at r = ${fmtNum(r, 4)} fm</div>
      ${led.rows.map(w => kv(w.name + (led.dom === w.id ? ' ◀' : ''), (Math.abs(w.V) < 1e-3 && w.V !== 0 ? fmtSig(w.V, 4) : fmtNum(w.V, 4)) + ' MeV')).join('')}
      ${kv('Cornell (quark level)', fmtNum(vCornell(r), 2) + ' MeV')}
      ${kv('carrier ranges ħ/mc', 'π: ' + fmtNum(RANGE_PION, 3) + ' fm · W: ' + fmtSig(RANGE_W, 3) + ' fm')}
      <p class="help">Yukawa's 1935 argument runs backwards from here: a force of range R needs a carrier of mass ħ/Rc. The 1.4 fm nuclear range predicted a ~140 MeV particle — the pion, found in 1947.</p>
    </div>`;
  },
  chip(st){
    const led = forceLedger(st.probe);
    return `<div class="k">V(r) explorer · r = ${fmtNum(st.probe, 3)} fm</div><div style="color:var(--c-pos)">dominant: ${led.dom}</div>`;
  },
  legend(){
    const rows = [['var(--c-curl)', 'strong (π Yukawa)'], ['var(--c-warn)', 'electromagnetic 1/r'], ['var(--c-neg)', 'weak (W-mass Yukawa)'], ['var(--faint)', 'gravity ×10³⁴']];
    if(ST && ST.showCornell) rows.push(['var(--c-grad)', 'Cornell −4αs/3r + σr']);
    return rows;
  }
};
