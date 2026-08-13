STAGES.qmPauli = {
  title: 'Pauli exclusion',
  derive(st){
    return {
      title:'Why identical particles change the rules, and why matter has volume',
      steps:[
        drvSay('identical means something stronger in quantum mechanics',
          'Two electrons are not merely similar — they are indistinguishable in principle. There is no experiment that could label one and follow it. So swapping them cannot change any prediction, and that requirement alone forces what follows.'),
        drvStep('swapping must leave every probability unchanged',
          `|ψ(${dv('x')}₁, ${dv('x')}₂)|² ${dop('=')} |ψ(${dv('x')}₂, ${dv('x')}₁)|²`,
          'the observable quantity is unaffected by relabelling'),
        drvStep('so the wavefunction itself may only change by a sign',
          `ψ(${dv('x')}₂, ${dv('x')}₁) ${dop('=')} ${dop('±')}ψ(${dv('x')}₁, ${dv('x')}₂)`,
          'swapping twice must give back the original, so the factor squares to 1'),
        drvSay('and nature uses both options',
          'Particles taking + are bosons — photons, phonons, helium-4. Those taking − are fermions — electrons, protons, neutrons. Which one a particle gets is fixed by its spin, and the spin-statistics theorem proving that connection requires relativistic quantum field theory. It is one of the deepest results in physics.'),
        drvStep('for fermions, put both in the same state and see what happens',
          `ψ(${dv('x')}, ${dv('x')}) ${dop('=')} ${dop('−')}ψ(${dv('x')}, ${dv('x')}) ${dop('⇒')} ψ ${dop('=')} 0`,
          st.fermion ? `states ${st.na} and ${st.nb} — set them equal and the panel shows the amplitude vanish` : 'switch to fermions to see the exclusion'),
        drvSay('so the exclusion principle is a consequence, not a postulate',
          'Pauli stated it as a rule in 1925. It is really a corollary of antisymmetry: a state with two fermions in the same place and the same spin has zero amplitude, so it never occurs. Nothing forbids it — there simply is no such state.'),
        drvStep('the antisymmetric combination is a determinant',
          `ψ ${dop('=')} ${dfrac('1', '√2')}[φ_a(${dv('x')}₁)φ_b(${dv('x')}₂) ${dop('−')} φ_a(${dv('x')}₂)φ_b(${dv('x')}₁)]`,
          'a 2×2 determinant — and it vanishes when two rows agree, exactly as determinants do'),
        drvSay('which is the linear-algebra wing appearing where it was not expected',
          'The Slater determinant generalises this to N particles. A determinant vanishing when two rows are equal is precisely the exclusion principle, and it is why the determinant is the natural object here rather than a computational trick.'),
        drvStep('and the plotted density shows the consequence directly',
          `fermions avoid the diagonal, bosons crowd it`,
          st.fermion ? 'the exchange hole along x₁ = x₂ is visible in the density' : 'bosons show the opposite: enhanced amplitude for being together'),
        drvSay('and this is why matter takes up space',
          'Electrons in an atom cannot all fall into the lowest orbital, so they stack upwards and atoms have size and chemistry. Press matter hard enough and the resulting degeneracy pressure is what holds up white dwarfs and neutron stars against gravity. Solidity is not electrostatic repulsion — it is antisymmetry.')
      ],
      note:'The two-particle density is computed from the properly symmetrised or antisymmetrised wavefunction, so the exchange hole and the bunching are results of the sign rather than drawn effects. Setting both quantum numbers equal makes the fermion density vanish identically.'
    };
  },
  enter(st, o){
    st.L = 10; st.na = o.na || 1; st.nb = o.nb || 2;
    st.fermion = o.fermion !== undefined ? o.fermion : true;
    st.probe = 3.2;               // x1 along the horizontal axis; x2 mirrored on the diagonal readout
    st.img = null; st.imgKey = '';
  },
  psi2(st, x1, x2){
    const { L, na, nb } = st;
    const a1 = qmWellPhi(na, L, x1), b2 = qmWellPhi(nb, L, x2);
    const a2 = qmWellPhi(na, L, x2), b1 = qmWellPhi(nb, L, x1);
    const s = st.fermion ? -1 : 1;
    const v = (a1 * b2 + s * a2 * b1) / Math.sqrt(2);
    return v * v;
  },
  controls(){
    const btn = (id, n) => `<button class="btn sm" data-qp="${id}:${n}" aria-pressed="${(id === 'a' ? ST.na : ST.nb) === n}">${n}</button>`;
    return `<div class="row"><label class="lb" style="width:86px">statistics</label>
        <div class="seg" id="qpSym">
          <button data-s="f" aria-pressed="${ST.fermion}">fermions (−)</button>
          <button data-s="b" aria-pressed="${!ST.fermion}">bosons (+)</button>
        </div></div>
      <div class="row"><label class="lb" style="width:86px">state a</label><div class="row" id="qpA">${[1,2,3].map(n => btn('a', n)).join('')}</div></div>
      <div class="row"><label class="lb" style="width:86px">state b</label><div class="row" id="qpB">${[1,2,3].map(n => btn('b', n)).join('')}</div></div>
      <p class="help">The map is the joint probability density |Ψ(x₁, x₂)|² for the two particles. The diagonal line is "both particles at the same place". For <b>fermions the density is exactly zero there</b> - the exchange hole - because swapping identical fermions must flip the sign of Ψ, so Ψ(x,x) = −Ψ(x,x) = 0. Set a = b: the fermion state vanishes <i>everywhere</i>. Two electrons cannot share a quantum state; a third electron in an atom is therefore forced into the next shell up - that is chemistry.</p>`;
  },
  wire(){
    for(const b of $('qpSym').children) b.addEventListener('click', () => {
      ST.fermion = b.dataset.s === 'f';
      for(const c of $('qpSym').children) c.setAttribute('aria-pressed', String(c === b));
      ST.imgKey = ''; refreshStageReadout(); updateStageLegend();
    });
    for(const b of $('stageBody').querySelectorAll('button[data-qp]')) b.addEventListener('click', () => {
      const [which, n] = b.dataset.qp.split(':');
      if(which === 'a') ST.na = +n; else ST.nb = +n;
      for(const c of $('stageBody').querySelectorAll('button[data-qp]')){
        const [w2, n2] = c.dataset.qp.split(':');
        c.setAttribute('aria-pressed', String((w2 === 'a' ? ST.na : ST.nb) === +n2));
      }
      ST.imgKey = ''; refreshStageReadout();
    });
  },
  frame(st, dt, ctx, W, H){
    const side = Math.min(W - 320, H - 110);
    const pl = st.pl = mkPlot(70, 56, side, side, 0, st.L, 0, st.L);
    const key = st.na + '|' + st.nb + '|' + st.fermion + '|' + (TH.dark ? 1 : 0);
    if(st.imgKey !== key){
      const G = 130, cv2 = document.createElement('canvas');
      cv2.width = cv2.height = G;
      const ictx = cv2.getContext('2d'), img = ictx.createImageData(G, G);
      let vmax = 1e-12;
      const vals = new Float64Array(G * G);
      for(let j = 0; j < G; j++) for(let i = 0; i < G; i++){
        const v = this.psi2(st, (i + 0.5) / G * st.L, (1 - (j + 0.5) / G) * st.L);
        vals[j * G + i] = v; if(v > vmax) vmax = v;
      }
      for(let k2 = 0; k2 < G * G; k2++){
        const c = rampSeq(Math.pow(vals[k2] / vmax, 0.6)), o = k2 * 4;
        img.data[o] = c[0] | 0; img.data[o + 1] = c[1] | 0; img.data[o + 2] = c[2] | 0; img.data[o + 3] = 255;
      }
      ictx.putImageData(img, 0, 0);
      st.img = cv2; st.imgKey = key; st.vmax = vmax;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(st.img, pl.px, pl.py, pl.pw, pl.ph);
    plotFrame(ctx, pl, 'x₁ — particle 1', 'x₂ — particle 2',
      (st.fermion ? 'fermions: Ψ antisymmetric' : 'bosons: Ψ symmetric') +
      ' — states n = ' + st.na + ', ' + st.nb);
    /* the diagonal x₁ = x₂ */
    ctx.strokeStyle = rgbCss(TH.text, 0.8); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(pl.X(0), pl.Y(0)); ctx.lineTo(pl.X(st.L), pl.Y(st.L)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = rgbCss(TH.text); ctx.font = '600 10.5px ' + FONT_UI;
    ctx.save(); ctx.translate(pl.X(st.L * 0.72), pl.Y(st.L * 0.72) - 8); ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'center'; ctx.fillText(st.fermion ? 'x₁ = x₂ : density exactly 0 (exchange hole)' : 'x₁ = x₂ : bosons BUNCH here', 0, 0);
    ctx.restore();
    /* probe cross on the diagonal-orthogonal cut */
    ctx.fillStyle = rgbCss(TH.text);
    ctx.beginPath(); ctx.arc(pl.X(st.probe), pl.Y(st.L - st.probe), 4.5, 0, 6.2832); ctx.fill();
    /* shell-filling ladder on the right: Pauli building the periodic table */
    const lx = pl.px + pl.pw + 46, lw = W - lx - 30;
    if(lw > 130){
      ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 11.5px ' + FONT_UI; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('why shells fill: 2 electrons per state', lx, 40);
      const shells = [['1s', 2, 56], ['2s', 2, 96], ['2p', 6, 128], ['3s', 2, 168], ['3p', 6, 200]];
      let electrons = 11;   // sodium: the classic "one loose electron" story
      for(const [nm, cap, y] of shells){
        ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(lx, y + 20); ctx.lineTo(lx + Math.min(lw, 26 * cap + 40), y + 20); ctx.stroke();
        ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10.5px ' + FONT_MONO;
        ctx.fillText(nm, lx, y + 2);
        for(let i2 = 0; i2 < cap; i2++){
          const filled = electrons > 0; if(filled) electrons--;
          const ax = lx + 34 + i2 * 24;
          ctx.strokeStyle = filled ? rgbCss(i2 % 2 ? TH.neg : TH.pos) : rgbCss(TH.line2);
          ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(ax, y + 16); ctx.lineTo(ax, y + 2); ctx.stroke();
          const dir2 = i2 % 2 ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(ax, i2 % 2 ? y + 16 : y + 2); ctx.lineTo(ax - 3, (i2 % 2 ? y + 16 : y + 2) + 4 * -dir2 * -1 * (i2 % 2 ? -1 : 1) + (i2 % 2 ? -4 : 4)); ctx.stroke();
        }
      }
      ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10.5px ' + FONT_UI;
      ctx.fillText('sodium, Z = 11: ten electrons exhaust', lx, 236);
      ctx.fillText('1s-2p; the 11th sits alone in 3s.', lx, 252);
      ctx.fillText('Alkali chemistry is a Pauli corollary.', lx, 268);
    }
    stageNote(ctx, 'same box, same states, one sign flipped — fermions keep apart (matter takes up space), bosons pile up (lasers, BEC)', W, H);
  },
  pick(st, sx, sy){
    if(st.pl && st.pl.inside(sx, sy)) st.probe = Math.max(0, Math.min(st.L, st.pl.invX(sx)));
  },
  readout(st){
    const same = this.psi2(st, st.probe, st.probe);
    const anti = this.psi2(st, st.probe, st.L - st.probe);
    return `<div class="card tight"><div class="ttl">At the probe — x₁ = ${fmtNum(st.probe, 3)}</div>
      ${kv('|Ψ(x₁, x₁)|² — together', st.fermion ? '<b>0 exactly</b>' : fmtNear(same))}
      ${kv('|Ψ(x₁, L−x₁)|² — far apart', fmtNear(anti))}
      ${kv('statistics', st.fermion ? 'antisymmetric — fermions (electrons, quarks)' : 'symmetric — bosons (photons, ⁴He)')}
    </div>
    <div class="card tight"><div class="ttl">Where it comes from</div>
      <p class="help">Identical particles are <b>indistinguishable</b>: swapping them cannot change any probability, so Ψ can only pick up ±1. Relativity ties the sign to spin (spin-statistics theorem): half-integer spin takes the minus. From that one sign: the exchange hole, shell structure, the periodic table, degeneracy pressure holding up white dwarfs, and why your hand does not pass through the desk.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">Pauli — ${st.fermion ? 'fermions' : 'bosons'}</div><div>states ${st.na}, ${st.nb}</div><div style="color:var(--c-pos)">Ψ(x,x) = ${st.fermion ? '0' : 'max'}</div>`;
  },
  legend(){ return [['var(--accent)', '|Ψ(x₁,x₂)|² joint density'], ['var(--text)', 'diagonal x₁ = x₂'], ['var(--c-pos)', 'shell ladder: 2 per state, spins paired']]; }
};

/* ---- 13 · spin on the Bloch sphere: precession, not orbits --------------------- */
STAGES.qmBloch = {
  title: 'Spin & precession',
  derive(st){
    const n = v => fmtNum(v, 6);
    const th = st.theta * Math.PI / 180;
    return {
      title:'A two-state system drawn as a sphere, and why it turns',
      steps:[
        drvSay('the smallest interesting quantum system',
          'Spin ½ has exactly two basis states. Any state is a combination of them with complex coefficients — four real numbers. Normalisation removes one, and an overall phase is unobservable and removes another. Two numbers remain, which is exactly enough to name a point on a sphere.'),
        drvStep('the general state',
          `|ψ⟩ ${dop('=')} cos(θ/2)|↑⟩ ${dop('+')} ${dop('e')}^(${dop('i')}φ)sin(θ/2)|↓⟩`,
          `θ = ${n(st.theta)}°, φ = ${n(st.phi * 180 / Math.PI)}° — the panel marks it on the sphere`),
        drvSay('the half-angle is the same signature as before',
          'θ and θ + 360° give states differing by a sign, so a full rotation does not return the state to itself. The Bloch sphere hides this by covering the state space twice over — which is why opposite points on it are orthogonal states rather than opposite directions.'),
        drvStep('the expected spin direction is the Bloch vector',
          `⟨${dv('S')}⟩ ${dop('=')} ${dfrac('ħ', '2')}(sin θ cos φ, sin θ sin φ, cos θ)`,
          'the panel reads off all three components at the marked point'),
        drvStep('a magnetic field gives an energy that depends on direction',
          `${dv('H')} ${dop('=')} ${dop('−')}γ${dv('B')}${dv('S')}_z`,
          `B = ${n(st.B)} along z, so the two basis states have different energies`),
        drvStep('and different energies means a relative phase that grows',
          `φ(${dv('t')}) ${dop('=')} φ₀ ${dop('+')} ω${dv('t')}, &nbsp; ω ${dop('=')} γ${dv('B')}`,
          'the Larmor frequency — the panel traces the precession on the sphere'),
        drvSay('so precession is interference between two energies',
          'The polar angle θ never changes, because the energy does not depend on φ. Only the relative phase advances, and on the sphere that is a rotation about the field axis. What looks like a spinning top is the beat between two energy levels.'),
        drvSay('and the classical analogy is close but not exact',
          'A classical magnetic moment in a field also precesses, at the same rate. The difference is that a measurement along any axis here gives only ±ħ/2, never the intermediate value the Bloch vector points at. The vector describes the probabilities, not a value being carried around.'),
        drvStep('and this is the mechanism behind magnetic resonance',
          `drive at ω ${dop('=')} γ${dv('B')} to tip the spin`,
          'NMR, MRI and every qubit gate work by resonating with exactly this precession'),
        drvSay('the same sphere describes any two-level system',
          'A qubit, a two-level atom, photon polarisation, neutrino oscillation between two flavours — all have two states and all live on this sphere. Quantum computing is largely the art of moving points around it with controlled fields.')
      ],
      note:'The precession is computed by evolving the two complex amplitudes with their own phases and re-deriving the Bloch vector at every frame, so the motion is a consequence of the energy difference rather than an imposed rotation.'
    };
  },
  mode: '3d',
  enter(st, o){
    st.theta = o.theta !== undefined ? o.theta : 55;   // polar angle of the spin state, deg
    st.B = o.B !== undefined ? o.B : 1.2;              // field along z -> Larmor omega
    st.phi = 0; st.probe = st.theta; st.trail = [];
    R.cam.az = 0.7; R.cam.el = 0.35; R.cam.dist = 8.5; R.cam.tx = R.cam.ty = R.cam.tz = 0;
  },
  controls(){
    return ctlRow('tilt θ', ctlSlider('qbTh', 0, 180, 1, ST.theta)) +
      ctlRow('field B (ω)', ctlSlider('qbB', 0, 3, 0.05, ST.B)) +
      `<p class="help">The whole spin-half state is one point on this sphere:
      <b>|χ⟩ = cos(θ/2)|↑⟩ + e<sup>iφ</sup> sin(θ/2)|↓⟩</b>. A magnetic field along z makes φ advance at
      the Larmor rate <b>ω = γB</b> — the arrow <b>precesses</b>, it does not orbit. Nothing moves in
      space; what rotates is the relative phase of two amplitudes. Measuring S<sub>z</sub> anywhere on the
      cone still returns only ±ħ/2, with the probabilities shown in the panel.</p>`;
  },
  wire(){
    wireSlider('qbTh', () => ST.theta, v => { ST.theta = v; ST.trail = []; }, v => v + '°');
    wireSlider('qbB', () => ST.B, v => { ST.B = v; }, v => (+v).toFixed(2));
  },
  frame(st, dt, ctx, W, H){
    st.phi += dt * st.B * 2;
    const th = st.theta * Math.PI / 180;
    R.mode2d = false; R.extent = 3;
    R.begin();
    /* the sphere: three great circles + meridians */
    const rr = 2.2;
    for(const ax of [0, 1, 2]){
      const rim = [];
      for(let i = 0; i <= 72; i++){
        const a = i / 72 * 6.2832;
        rim.push(planePt(ax, 0, rr * Math.cos(a), rr * Math.sin(a)));
      }
      R.path(rim, rgbCss(TH.line2), ax === 2 ? 1.4 : 0.8, ax === 2 ? 0.8 : 0.45);
    }
    /* poles = the two eigenstates */
    R.dot(v3(0, 0, rr), 4.5, rgbCss(TH.pos), rgbCss(TH.bg));
    R.label(v3(0, 0, rr * 1.18), '|↑⟩  Sz = +ℏ/2', rgbCss(TH.pos), 0, 0, '600 11px ' + FONT_UI);
    R.dot(v3(0, 0, -rr), 4.5, rgbCss(TH.neg), rgbCss(TH.bg));
    R.label(v3(0, 0, -rr * 1.2), '|↓⟩  Sz = −ℏ/2', rgbCss(TH.neg), 0, 0, '600 11px ' + FONT_UI);
    /* B field arrow */
    if(st.B > 0.01){
      R.arrow(v3(-rr * 1.25, -rr * 1.25, -rr * 0.6), v3(0, 0, rr * 1.1), rgbCss(TH.warn), 2, 0.9);
      R.label(v3(-rr * 1.25, -rr * 1.25, rr * 0.75), 'B', rgbCss(TH.warn), 0, 0, '600 12px ' + FONT_UI);
    }
    /* the spin expectation vector and its precession cone */
    const sv = v3(rr * Math.sin(th) * Math.cos(st.phi), rr * Math.sin(th) * Math.sin(st.phi), rr * Math.cos(th));
    st.trail.push(v3(sv.x, sv.y, sv.z));
    if(st.trail.length > 90) st.trail.shift();
    R.path(st.trail, rgbCss(TH.curl, 0.8), 1.4, 0.7);
    R.arrow(v3(0, 0, 0), sv, rgbCss(TH.curl), 3);
    R.label(vmul(sv, 1.16), '⟨S⟩', rgbCss(TH.curl), 0, 0, '700 12px ' + FONT_UI);
    /* the cone rim at this theta */
    const cone = [];
    for(let i = 0; i <= 72; i++){
      const a = i / 72 * 6.2832;
      cone.push(v3(rr * Math.sin(th) * Math.cos(a), rr * Math.sin(th) * Math.sin(a), rr * Math.cos(th)));
    }
    R.path(cone, rgbCss(TH.curl, 0.5), 1, 0.5);
    R.label(v3(0, 0, -rr * 1.55), 'precession at ω = γB — it is the relative phase of the two amplitudes that turns, not the electron', rgbCss(TH.faint), 0, 0, '10.5px ' + FONT_UI);
    R.flush();
  },
  readout(st){
    const th = st.theta * Math.PI / 180;
    const pUp = Math.cos(th / 2) ** 2;
    return `<div class="card tight"><div class="ttl">The state at θ = ${st.theta}°</div>
      ${kv('|χ⟩', 'cos(' + (st.theta / 2).toFixed(1) + '°)|↑⟩ + e<sup>iφ</sup> sin(' + (st.theta / 2).toFixed(1) + '°)|↓⟩')}
      ${kv('P(S<sub>z</sub> = +ℏ/2) = cos²(θ/2)', fmtNum(pUp, 4))}
      ${kv('P(S<sub>z</sub> = −ℏ/2) = sin²(θ/2)', fmtNum(1 - pUp, 4))}
      ${kv('⟨S<sub>z</sub>⟩ = (ℏ/2)cos θ', fmtNum(Math.cos(th) / 2, 4) + ' ℏ')}
      ${kv('phase φ now', fmtNum(((st.phi % 6.2832) + 6.2832) % 6.2832, 3) + ' rad')}
      ${kv('Larmor ω', fmtNum(st.B * 2, 3) + ' rad/s (here γ = 2)')}
    </div>
    <div class="card tight"><div class="ttl">Orbits vs orbitals vs spin</div>
      <p class="help"><b>Nothing orbits in an atom.</b> Electron "orbitals" are standing waves - the stationary |ψ|² patterns of the quantum wing, with zero net current for s-states. <b>Spin is not spinning</b>: the electron is pointlike as far as any experiment can see; spin is intrinsic angular momentum with no rotating matter behind it, and its half-integer value is why 360° of precession returns |χ⟩ to <b>minus</b> itself (the spinor sign, real and measurable in neutron interferometry). What genuinely orbits - planets, the Kepler demos in the vector wing - obeys the same angular-momentum algebra, but with L quantised in whole ℏ steps.</p>
    </div>`;
  },
  chip(st){
    const pUp = Math.cos(st.theta * Math.PI / 360) ** 2;
    return `<div class="k">Bloch sphere</div><div>θ = ${st.theta}°</div><div style="color:var(--c-pos)">P(↑) = ${fmtNum(pUp, 3)}</div><div style="color:var(--c-curl)">φ = ${fmtNum(((st.phi % 6.2832) + 6.2832) % 6.2832, 2)}</div>`;
  },
  legend(){ return [['var(--c-curl)', '⟨S⟩ — the spin expectation vector'], ['var(--c-pos)', '|↑⟩ pole'], ['var(--c-neg)', '|↓⟩ pole'], ['var(--c-warn)', 'magnetic field B']]; }
};

/* ---- 14 · the Standard Model: every fermion and boson -------------------------- */
